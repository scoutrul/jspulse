import { AppError } from '../../middleware/ApiError.js';
import { containerFactory } from '../../container/ContainerFactory.js';
import type { IVacancyRepository, ICacheStats, VacancyDTO, IFindResult } from '@jspulse/shared';
import { DI_TOKENS } from '@jspulse/shared';
import { MemoryCacheService } from '../MemoryCacheService.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Интерфейс для системной статистики
 */
export interface SystemStats {
  vacancies: {
    total: number;
    recent24h: number;
    withFullDescription: number;
  };
  skills: {
    unique: number;
    total: number;
  };
  cache: {
    hitRate: number;
    keys: number;
    totalRequests: number;
    totalHits: number;
  };
  scheduler: {
    status: string;
    lastRun: Date | null;
    nextRun: Date | null;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    timestamp: Date;
  };
}

/**
 * Интерфейс для топ навыков
 */
export interface TopSkill {
  skill: string;
  count: number;
  percentage: number;
}

/**
 * Интерфейс для последних вакансий
 */
export interface RecentVacancy {
  id: string;
  title: string;
  companyName: string;
  skills: string[];
  createdAt: Date;
  source: string;
}

/**
 * Интерфейс для результата административной операции
 */
export interface AdminOperationResult {
  success: boolean;
  message: string;
  details?: unknown;
  executionTime: number;
}

/**
 * Сервис для административных операций JSPulse
 */
class AdminService {
  private readonly vacancyRepository: IVacancyRepository;
  private readonly cacheService: MemoryCacheService;

  constructor() {
    const container = containerFactory.createProduction();
    this.vacancyRepository = container.resolve<IVacancyRepository>(DI_TOKENS.VACANCY_REPOSITORY);
    this.cacheService = container.resolve<MemoryCacheService>(DI_TOKENS.CACHE_SERVICE);
  }

  /**
   * Получает агрегированную статистику системы
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const startTime = Date.now();

      // Используем правильные методы репозитория
      const [
        totalVacancies,
        recentVacanciesResult,
        vacanciesWithFullDescResult,
        uniqueSkills,
        cacheStats
      ] = await Promise.all([
        this.vacancyRepository.count({}),
        this.getRecentVacanciesCount(),
        this.getVacanciesWithFullDescCount(),
        this.vacancyRepository.getUniqueSkills(),
        this.cacheService.getStats()
      ]);

      const executionTime = Date.now() - startTime;

      return {
        vacancies: {
          total: totalVacancies,
          recent24h: recentVacanciesResult,
          withFullDescription: vacanciesWithFullDescResult
        },
        skills: {
          unique: uniqueSkills.length,
          total: await this.getTotalSkillsCount()
        },
        cache: {
          hitRate: cacheStats.hitRate,
          keys: cacheStats.totalKeys,
          totalRequests: cacheStats.hits + cacheStats.misses,
          totalHits: cacheStats.hits
        },
        scheduler: {
          status: 'unknown', // TODO: интеграция с планировщиком
          lastRun: null,
          nextRun: null
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      throw AppError.internal('Failed to get system statistics');
    }
  }

  /**
   * Получает количество вакансий за последние 24 часа
   */
  private async getRecentVacanciesCount(): Promise<number> {
    try {
      // Используем findWithFilters для поиска с временными критериями
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await this.vacancyRepository.findWithFilters({
        page: 0,
        limit: 1,
        where: {},
        // Фильтруем через where критерии
      });

      // Считаем вручную через общее количество
      const allVacanciesResult = await this.vacancyRepository.findWithFilters({
        page: 0,
        limit: 1000, // Берем большую выборку
        where: {}
      });

      // Фильтруем по дате на стороне приложения - используем publishedAt вместо createdAt
      const recentCount = allVacanciesResult.data.filter(vacancy =>
        vacancy.publishedAt && new Date(vacancy.publishedAt) >= yesterday
      ).length;

      return recentCount;
    } catch (error) {
      console.error('Error getting recent vacancies count:', error);
      return 0;
    }
  }

  /**
   * Получает количество вакансий с полным описанием
   */
  private async getVacanciesWithFullDescCount(): Promise<number> {
    try {
      // Получаем все вакансии и фильтруем на стороне приложения
      const result = await this.vacancyRepository.findWithFilters({
        page: 0,
        limit: 1000,
        where: {}
      });

      const withFullDescCount = result.data.filter(vacancy =>
        vacancy.fullDescription && vacancy.fullDescription.trim().length > 0
      ).length;

      return withFullDescCount;
    } catch (error) {
      console.error('Error getting vacancies with full description count:', error);
      return 0;
    }
  }

  /**
   * Получает общее количество навыков через статистику
   */
  private async getTotalSkillsCount(): Promise<number> {
    try {
      const stats = await this.vacancyRepository.getStatistics();
      return stats.bySkills.reduce((total, skillStat) => total + skillStat.count, 0);
    } catch (error) {
      console.error('Error getting total skills count:', error);
      return 0;
    }
  }

  /**
   * Получает топ навыков с количеством вакансий
   */
  async getTopSkills(limit = 10): Promise<TopSkill[]> {
    try {
      const stats = await this.vacancyRepository.getStatistics();
      const totalVacancies = stats.total;

      return stats.bySkills
        .slice(0, limit)
        .map(skillStat => ({
          skill: skillStat.skill,
          count: skillStat.count,
          percentage: totalVacancies > 0 ? Math.round((skillStat.count / totalVacancies) * 100) : 0
        }));
    } catch (error) {
      console.error('Error getting top skills:', error);
      throw AppError.internal('Failed to get top skills');
    }
  }

  /**
   * Получает последние добавленные вакансии
   */
  async getRecentVacancies(limit = 10): Promise<RecentVacancy[]> {
    try {
      const result: IFindResult<VacancyDTO> = await this.vacancyRepository.findWithFilters({
        page: 0,
        limit,
        where: {}
      });

      return result.data.map(vacancy => ({
        id: vacancy._id || 'unknown',
        title: vacancy.title,
        companyName: vacancy.company || 'Unknown Company',
        skills: vacancy.skills || [],
        createdAt: vacancy.publishedAt,
        source: vacancy.source || 'unknown'
      }));
    } catch (error) {
      console.error('Error getting recent vacancies:', error);
      throw AppError.internal('Failed to get recent vacancies');
    }
  }

  /**
   * Запускает парсинг HeadHunter API
   */
  async startHHParsing(): Promise<AdminOperationResult> {
    const startTime = Date.now();

    try {
      console.log('Starting HeadHunter parsing...');

      // Путь к скрипту парсинга относительно текущей директории
      const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'fetchAndSaveFromHH.ts');

      // Запускаем скрипт через ts-node
      const { stdout, stderr } = await execAsync(`npx ts-node ${scriptPath}`, {
        cwd: process.cwd(),
        timeout: 300000 // 5 минут timeout
      });

      const executionTime = Date.now() - startTime;

      console.log('HH parsing completed successfully');
      console.log('Output:', stdout);

      if (stderr) {
        console.warn('Warnings:', stderr);
      }

      return {
        success: true,
        message: 'HeadHunter parsing completed successfully',
        details: {
          output: stdout,
          warnings: stderr || null
        },
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error('Error running HH parsing:', error);

      return {
        success: false,
        message: 'Failed to run HeadHunter parsing',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null
        },
        executionTime
      };
    }
  }

  /**
   * Очищает базу данных (опасная операция)
   */
  async clearDatabase(): Promise<AdminOperationResult> {
    const startTime = Date.now();

    try {
      console.log('Starting database cleanup...');

      // Путь к скрипту очистки
      const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'clearDatabase.ts');

      // Запускаем скрипт через ts-node
      const { stdout, stderr } = await execAsync(`npx ts-node ${scriptPath}`, {
        cwd: process.cwd(),
        timeout: 60000 // 1 минута timeout
      });

      const executionTime = Date.now() - startTime;

      console.log('Database cleanup completed successfully');
      console.log('Output:', stdout);

      if (stderr) {
        console.warn('Warnings:', stderr);
      }

      // Очищаем кэш после очистки БД
      this.cacheService.clear();

      return {
        success: true,
        message: 'Database cleared successfully',
        details: {
          output: stdout,
          warnings: stderr || null,
          cacheCleared: true
        },
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error('Error clearing database:', error);

      return {
        success: false,
        message: 'Failed to clear database',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : null
        },
        executionTime
      };
    }
  }

  /**
   * Получает состояние планировщика (заглушка для будущей интеграции)
   */
  async getSchedulerStatus(): Promise<{
    status: string;
    lastRun: Date | null;
    nextRun: Date | null;
    jobs: Array<{
      id: string;
      name: string;
      status: string;
      lastRun: Date | null;
      nextRun: Date | null;
    }>;
  }> {
    try {
      // TODO: Интеграция с реальным планировщиком
      return {
        status: 'running',
        lastRun: null,
        nextRun: null,
        jobs: []
      };
    } catch (error) {
      console.error('Error getting scheduler status:', error);
      throw AppError.internal('Failed to get scheduler status');
    }
  }

  /**
   * Перезапускает сервис кэширования
   */
  async restartCacheService(): Promise<AdminOperationResult> {
    const startTime = Date.now();

    try {
      // Получаем статистику до очистки
      const statsBefore = await this.cacheService.getStats();

      // Очищаем кэш
      this.cacheService.clear();

      // Получаем статистику после очистки
      const statsAfter = await this.cacheService.getStats();

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        message: 'Cache service restarted successfully',
        details: {
          before: statsBefore,
          after: statsAfter,
          itemsCleared: statsBefore.totalKeys
        },
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.error('Error restarting cache service:', error);

      return {
        success: false,
        message: 'Failed to restart cache service',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        executionTime
      };
    }
  }
}

// Экспортируем singleton instance
export const adminService = new AdminService(); 