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
      // Берем уже нормализованный список уникальных навыков из репозитория
      const uniqueSkills = await this.vacancyRepository.getUniqueSkills();

      return {
        success: true,
        data: uniqueSkills,
        meta: {
          total: uniqueSkills.length,
          uniqueCount: uniqueSkills.length
        }
      };
    } catch (error) {
      console.error('Error in GetSkillsUseCase:', error);
      // Возвращаем безопасный пустой ответ вместо ошибки, чтобы UI не ломался
      return {
        success: true,
        data: [],
        meta: {
          total: 0,
          uniqueCount: 0
        }
      };
    }
  }
}
