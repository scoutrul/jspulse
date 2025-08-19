import { IUseCaseWithParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';

/**
 * DTO для запроса вакансии по ID
 */
export interface GetVacancyByIdRequest {
  id: string;
}

/**
 * DTO для ответа с вакансией
 */
export interface GetVacancyByIdResponse {
  vacancy: any | null;
  found: boolean;
}

/**
 * Use Case для получения вакансии по ID
 * Заменяет бизнес-логику из старого vacancyRoutes
 */
export class GetVacancyByIdUseCase implements IUseCaseWithParams<GetVacancyByIdRequest, GetVacancyByIdResponse> {
  constructor(
    private readonly vacancyRepository: IVacancyRepository
  ) { }

  async execute(request: GetVacancyByIdRequest): Promise<GetVacancyByIdResponse> {
    try {
      const { id } = request;

      if (!id) {
        throw new Error('Vacancy ID is required');
      }

      // Получаем вакансию из репозитория
      const vacancy = await this.vacancyRepository.findById(id);

      return {
        vacancy,
        found: !!vacancy
      };
    } catch (error) {
      console.error('Error in GetVacancyByIdUseCase:', error);
      throw new Error('Failed to get vacancy by ID');
    }
  }
}
