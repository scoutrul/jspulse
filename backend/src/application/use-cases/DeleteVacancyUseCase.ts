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
      console.log('DeleteVacancyUseCase: Attempting to delete vacancy with ID:', id);

      if (!id) {
        throw new Error('Vacancy ID is required');
      }

      // Проверяем, существует ли вакансия
      console.log('DeleteVacancyUseCase: Checking if vacancy exists...');
      const existingVacancy = await this.vacancyRepository.findById(id);
      console.log('DeleteVacancyUseCase: Existing vacancy found:', existingVacancy ? 'YES' : 'NO');

      if (!existingVacancy) {
        console.log('DeleteVacancyUseCase: Vacancy not found, returning 404');
        return {
          success: false,
          deleted: false,
          id
        };
      }

      // Удаляем вакансию
      console.log('DeleteVacancyUseCase: Deleting vacancy...');
      const deleted = await this.vacancyRepository.deleteById(id);
      console.log('DeleteVacancyUseCase: Deletion result:', deleted);

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
