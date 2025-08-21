import { IUseCaseWithParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';

/**
 * DTO для запроса удаления вакансии
 */
export interface DeleteVacancyRequest {
  id: string;
}

/**
 * DTO для ответа удаления вакансии
 */
export interface DeleteVacancyResponse {
  success: boolean;
  deleted: boolean;
  id: string;
}

/**
 * Use Case для удаления вакансии
 * Координирует удаление и очистку связанных данных
 */
export class DeleteVacancyUseCase implements IUseCaseWithParams<DeleteVacancyRequest, DeleteVacancyResponse> {
  constructor(
    private readonly vacancyRepository: IVacancyRepository
  ) { }

  async execute(request: DeleteVacancyRequest): Promise<DeleteVacancyResponse> {
    try {
      const { id } = request;

      if (!id) {
        throw new Error('Vacancy ID is required');
      }

      // Проверяем, существует ли вакансия
      const existingVacancy = await this.vacancyRepository.findById(id);
      if (!existingVacancy) {
        return {
          success: false,
          deleted: false,
          id
        };
      }

      // Удаляем вакансию
      const deleted = await this.vacancyRepository.deleteById(id);

      return {
        success: true,
        deleted,
        id
      };
    } catch (error) {
      console.error('Error in DeleteVacancyUseCase:', error);
      throw new Error('Failed to delete vacancy');
    }
  }
}
