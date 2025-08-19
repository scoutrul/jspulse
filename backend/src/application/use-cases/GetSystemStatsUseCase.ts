import { IUseCaseWithoutParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';
import { VacancyDomainService } from '../../domain/services/VacancyDomainService.js';

/**
 * DTO для системной статистики
 */
export interface SystemStatsResponse {
  totalVacancies: number;
  recent24h: number;
  bySource: Record<string, number>;
  topSkills: Array<{ skill: string; count: number }>;
  salaryStats: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
  workFormatStats: {
    remote: number;
    office: number;
    hybrid: number;
  };
  timestamp: Date;
}

/**
 * Use Case для получения системной статистики
 * Заменяет бизнес-логику из adminRoutes
 */
export class GetSystemStatsUseCase implements IUseCaseWithoutParams<SystemStatsResponse> {
  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly vacancyDomainService: VacancyDomainService
  ) { }

  async execute(): Promise<SystemStatsResponse> {
    try {
      // Получаем статистику из репозитория
      const repoStats = await this.vacancyRepository.getStatistics();

      // Получаем все вакансии для дополнительных расчетов
      const allVacanciesResult = await this.vacancyRepository.findWithFilters({
        page: 0,
        limit: 10000,
        includeArchived: true
      });

      // Преобразуем в domain entities
      const domainVacancies = this.mapToDomainEntities(allVacanciesResult.data);

      // Применяем domain логику для дополнительных расчетов
      const workFormatStats = this.calculateWorkFormatStats(domainVacancies);

      // Подсчет вакансий за последние 24 часа
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent24h = domainVacancies.filter(v => v.publishedAt > yesterday).length;

      return {
        totalVacancies: repoStats.total,
        recent24h,
        bySource: repoStats.bySource,
        topSkills: repoStats.bySkills,
        salaryStats: repoStats.salaryRanges,
        workFormatStats,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in GetSystemStatsUseCase:', error);
      throw new Error('Failed to get system statistics');
    }
  }

  /**
   * Расчет статистики по формату работы
   */
  private calculateWorkFormatStats(vacancies: any[]): { remote: number; office: number; hybrid: number } {
    let remote = 0;
    let office = 0;
    let hybrid = 0;

    vacancies.forEach(vacancy => {
      if (vacancy.isRemote()) {
        remote++;
      } else if (vacancy.isOffice()) {
        office++;
      } else {
        hybrid++;
      }
    });

    return { remote, office, hybrid };
  }

  /**
   * Преобразование DTO в domain entities
   */
  private mapToDomainEntities(vacancyDtos: any[]): any[] {
    // Упрощенное преобразование для статистики
    // В реальном приложении здесь был бы полный маппинг
    return vacancyDtos.map(dto => ({
      publishedAt: new Date(dto.publishedAt),
      location: dto.location,
      isRemote: () => {
        if (!dto.location) return false;
        const location = dto.location.toLowerCase();
        return location.includes('удаленно') ||
          location.includes('remote') ||
          location.includes('удаленка');
      },
      isOffice: () => {
        if (!dto.location) return false;
        const location = dto.location.toLowerCase();
        return location.includes('офис') ||
          location.includes('office') ||
          !(location.includes('удаленно') ||
            location.includes('remote') ||
            location.includes('удаленка'));
      }
    }));
  }
}
