import { IUseCaseWithoutParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';

/**
 * DTO для статистики навыка
 */
export interface SkillStats {
  name: string;
  count: number;
  percentage: number;
  averageSalary?: number;
}

/**
 * DTO для ответа со статистикой навыков
 */
export interface GetSkillsStatsResponse {
  success: boolean;
  data: SkillStats[];
  meta: {
    totalSkills: number;
    totalVacancies: number;
    topSkills: string[];
  };
}

/**
 * Use Case для получения статистики навыков
 */
export class GetSkillsStatsUseCase implements IUseCaseWithoutParams<GetSkillsStatsResponse> {
  constructor(private readonly vacancyRepository: IVacancyRepository) { }

  async execute(): Promise<GetSkillsStatsResponse> {
    try {
      // Получаем все вакансии для анализа
      const result = await this.vacancyRepository.findMany({
        page: 0,
        limit: 10000,
        skills: [],
        sources: [],
        includeArchived: true
      });

      // Собираем статистику по навыкам
      const skillsMap = new Map<string, { count: number; totalSalary: number; salaryCount: number }>();
      let totalVacancies = 0;

      result.data.forEach(vacancy => {
        totalVacancies++;

        if (vacancy.skills && Array.isArray(vacancy.skills)) {
          vacancy.skills.forEach(skill => {
            const skillName = typeof skill === 'string' ? skill : 'unknown';

            if (!skillsMap.has(skillName)) {
              skillsMap.set(skillName, { count: 0, totalSalary: 0, salaryCount: 0 });
            }

            const skillStats = skillsMap.get(skillName)!;
            skillStats.count++;

            // Считаем среднюю зарплату
            if (vacancy.salaryFrom || vacancy.salaryTo) {
              let salary = 0;
              if (vacancy.salaryFrom && vacancy.salaryTo) {
                salary = (vacancy.salaryFrom + vacancy.salaryTo) / 2;
              } else if (vacancy.salaryFrom) {
                salary = vacancy.salaryFrom;
              } else if (vacancy.salaryTo) {
                salary = vacancy.salaryTo;
              }

              if (salary > 0) {
                skillStats.totalSalary += salary;
                skillStats.salaryCount++;
              }
            }
          });
        }
      });

      // Преобразуем в массив и сортируем по популярности
      const skillsStats: SkillStats[] = Array.from(skillsMap.entries())
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          percentage: totalVacancies > 0 ? (stats.count / totalVacancies) * 100 : 0,
          averageSalary: stats.salaryCount > 0 ? Math.round(stats.totalSalary / stats.salaryCount) : undefined
        }))
        .sort((a, b) => b.count - a.count);

      // Получаем топ-10 навыков
      const topSkills = skillsStats.slice(0, 10).map(skill => skill.name);

      return {
        success: true,
        data: skillsStats,
        meta: {
          totalSkills: skillsStats.length,
          totalVacancies,
          topSkills
        }
      };
    } catch (error) {
      console.error('Error in GetSkillsStatsUseCase:', error);
      throw new Error('Failed to retrieve skills statistics');
    }
  }
}
