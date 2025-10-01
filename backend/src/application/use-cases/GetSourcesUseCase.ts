import { IUseCaseWithoutParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';

export interface GetSourcesResponse {
  success: boolean;
  data: string[];
  meta: {
    total: number;
  };
}

export class GetSourcesUseCase implements IUseCaseWithoutParams<GetSourcesResponse> {
  constructor(private readonly vacancyRepository: IVacancyRepository) { }

  async execute(): Promise<GetSourcesResponse> {
    try {
      const sources = await this.vacancyRepository.getUniqueSources();
      return {
        success: true,
        data: sources,
        meta: { total: sources.length }
      };
    } catch (error) {
      console.error('Error in GetSourcesUseCase:', error);
      return {
        success: true,
        data: [],
        meta: { total: 0 }
      };
    }
  }
}
