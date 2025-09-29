import { IUseCaseWithoutParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';

/**
 * DTO для ответа со списком навыков
 */
export interface GetSkillsResponse {
  success: boolean;
  data: string[];
  meta: {
    total: number;
    uniqueCount: number;
  };
}

/**
 * Use Case для получения списка уникальных навыков
 */
export class GetSkillsUseCase implements IUseCaseWithoutParams<GetSkillsResponse> {
  constructor(private readonly vacancyRepository: IVacancyRepository) { }

  async execute(): Promise<GetSkillsResponse> {
    try {
      // Получаем только активные вакансии (≤ 30 дней) для извлечения навыков
      const result = await this.vacancyRepository.findMany({
        page: 0,
        limit: 10000, // Получаем достаточный объем для полного списка навыков
        skills: [],
        sources: [],
        includeArchived: false
      });

      // Извлекаем все навыки из вакансий
      const allSkills: string[] = [];
      result.data.forEach(vacancy => {
        if (vacancy.skills && Array.isArray(vacancy.skills)) {
          vacancy.skills.forEach(skill => {
            if (typeof skill === 'string') {
              allSkills.push(skill);
            }
          });
        }
      });

      // Убираем дубликаты и сортируем
      const uniqueSkills = [...new Set(allSkills)].sort();

      return {
        success: true,
        data: uniqueSkills,
        meta: {
          total: allSkills.length,
          uniqueCount: uniqueSkills.length
        }
      };
    } catch (error) {
      console.error('Error in GetSkillsUseCase:', error);
      throw new Error('Failed to retrieve skills');
    }
  }
}
