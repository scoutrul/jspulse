import { IUseCaseWithParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';
import { VacancyDomainService } from '../../domain/services/VacancyDomainService.js';
import { Vacancy } from '../../domain/entities/Vacancy.js';
import { Skill } from '../../domain/entities/Skill.js';
import { Salary } from '../../domain/value-objects/Salary.js';
import { Company } from '../../domain/value-objects/Company.js';
import { VacancyApiResponseDto } from '../dto/VacancyApiResponseDto.js';

/**
 * DTO для запроса получения вакансий
 */
export interface GetVacanciesRequest {
  page?: number;
  limit?: number;
  skills?: string[];
  salaryRange?: {
    from?: number;
    to?: number;
  };
  sources?: string[];
  publishedAfter?: Date;
  publishedBefore?: Date;
  searchText?: string;
  sortBy?: 'publishedAt' | 'salary' | 'title' | 'company';
  sortDirection?: 'asc' | 'desc';
  includeArchived?: boolean;
}

/**
 * DTO для ответа получения вакансий
 */
export interface GetVacanciesResponse {
  success: boolean;
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalItems: number;
  };
}

/**
 * Use Case для получения вакансий с фильтрацией
 * Координирует получение данных, применение бизнес-правил и пагинацию
 */
export class GetVacanciesUseCase implements IUseCaseWithParams<GetVacanciesRequest, GetVacanciesResponse> {
  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly vacancyDomainService: VacancyDomainService
  ) { }

  async execute(request: GetVacanciesRequest): Promise<GetVacanciesResponse> {
    try {
      // Получаем данные из репозитория
      const result = await this.vacancyRepository.findMany({
        page: request.page || 0,
        limit: request.limit || 10,
        skills: request.skills || [],
        salaryRange: request.salaryRange,
        sources: request.sources || [],
        publishedAfter: request.publishedAfter,
        publishedBefore: request.publishedBefore,
        searchText: request.searchText,
        includeArchived: request.includeArchived
      });

      // Преобразуем DTO в domain entities
      const vacancies = this.mapToDomainEntities(result.data);

      // Применяем фильтрацию и сортировку через domain service
      let filteredVacancies = vacancies;

      if (request.skills && request.skills.length > 0) {
        filteredVacancies = this.vacancyDomainService.filterBySkills(filteredVacancies, request.skills);
      }

      if (request.salaryRange) {
        filteredVacancies = this.vacancyDomainService.filterBySalaryRange(
          filteredVacancies,
          request.salaryRange.from,
          request.salaryRange.to
        );
      }

      // Сортируем вакансии
      const sortBy = request.sortBy || 'publishedAt';
      const sortDirection = request.sortDirection || 'desc';
      filteredVacancies = this.vacancyDomainService.sortVacancies(
        filteredVacancies,
        sortBy,
        sortDirection
      );

      // Преобразуем domain entities в API DTO
      const apiVacancies = filteredVacancies.map(vacancy =>
        VacancyApiResponseDto.fromVacancy(vacancy)
      );

      const page = request.page || 0;
      const limit = request.limit || 10;

      return VacancyApiResponseDto.createApiResponse(apiVacancies, {
        page,
        limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
        hasNextPage: result.meta.hasNextPage,
        hasPrevPage: result.meta.hasPrevPage
      });
    } catch (error) {
      console.error('Error in GetVacanciesUseCase:', error);
      throw error;
    }
  }

  /**
   * Преобразование DTO в domain entities
   */
  private mapToDomainEntities(vacancyDtos: any[]): Vacancy[] {
    return vacancyDtos.map(dto => {
      // Проверяем, что у нас есть валидный ID
      const id = dto._id || dto.id;
      if (!id) {
        console.warn('Vacancy without ID found:', dto);
        return null; // Пропускаем вакансии без ID
      }

      // Создаем Value Objects
      const skills = dto.skills?.map((skillName: string) => new Skill(skillName)) || [];
      const salary = new Salary(dto.salaryFrom, dto.salaryTo, dto.salaryCurrency || 'RUR');
      const company = new Company(dto.company?.name || dto.company, dto.company?.trusted || dto.companyTrusted || false);

      // Создаем domain entity
      return new Vacancy(
        id,
        dto.title,
        company,
        skills,
        salary,
        new Date(dto.publishedAt),
        dto.source,
        dto.location,
        dto.description,
        dto.experience,
        dto.employment,
        dto.url
      );
    }).filter(Boolean) as Vacancy[]; // Убираем null значения
  }
}
