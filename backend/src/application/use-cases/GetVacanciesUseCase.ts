import { IUseCaseWithParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';
import { VacancyDomainService } from '../../domain/services/VacancyDomainService.js';
import { Vacancy } from '../../domain/entities/Vacancy.js';
import { Skill } from '../../domain/entities/Skill.js';
import { Salary } from '../../domain/entities/Salary.js';
import { Company } from '../../domain/entities/Company.js';

/**
 * DTO для запроса вакансий
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
 * DTO для ответа с вакансиями
 */
export interface GetVacanciesResponse {
  vacancies: Record<string, any>[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
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
      const {
        page = 0,
        limit = 10,
        skills = [],
        salaryRange,
        sources = [],
        publishedAfter,
        publishedBefore,
        searchText,
        sortBy = 'publishedAt',
        sortDirection = 'desc',
        includeArchived = false
      } = request;

      // Получаем все вакансии из репозитория
      const allVacanciesResult = await this.vacancyRepository.findWithFilters({
        page: 0,
        limit: 10000, // Получаем все для применения domain логики
        skills,
        salaryRange,
        sources,
        publishedAfter,
        publishedBefore,
        searchText,
        includeArchived
      });

      // Преобразуем в domain entities
      const domainVacancies = this.mapToDomainEntities(allVacanciesResult.data);

      // Применяем domain логику
      let filteredVacancies = domainVacancies;

      // Фильтрация по навыкам (если не была применена в репозитории)
      if (skills.length > 0) {
        filteredVacancies = this.vacancyDomainService.filterBySkills(filteredVacancies, skills);
      }

      // Фильтрация по зарплате
      if (salaryRange) {
        filteredVacancies = this.vacancyDomainService.filterBySalaryRange(
          filteredVacancies,
          salaryRange.from,
          salaryRange.to
        );
      }

      // Фильтрация по источнику
      if (sources.length > 0) {
        filteredVacancies = this.vacancyDomainService.filterBySource(filteredVacancies, sources);
      }

      // Фильтрация по дате
      if (publishedAfter || publishedBefore) {
        filteredVacancies = this.vacancyDomainService.filterByDateRange(
          filteredVacancies,
          publishedAfter,
          publishedBefore
        );
      }

      // Фильтрация по архивности
      if (!includeArchived) {
        filteredVacancies = this.vacancyDomainService.filterActive(filteredVacancies);
      }

      // Текстовый поиск
      if (searchText) {
        filteredVacancies = this.vacancyDomainService.searchByText(filteredVacancies, searchText);
      }

      // Сортировка
      filteredVacancies = this.vacancyDomainService.sortVacancies(
        filteredVacancies,
        sortBy,
        sortDirection
      );

      // Применяем пагинацию
      const total = filteredVacancies.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const paginatedVacancies = filteredVacancies.slice(startIndex, endIndex);

      // Преобразуем обратно в DTO для API
      const vacancyDtos = paginatedVacancies.map(vacancy => vacancy.toJSON());

      return {
        vacancies: vacancyDtos,
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages - 1,
          hasPrevPage: page > 0
        }
      };
    } catch (error) {
      console.error('Error in GetVacanciesUseCase:', error);
      throw new Error('Failed to get vacancies');
    }
  }

  /**
   * Преобразование DTO в domain entities
   */
  private mapToDomainEntities(vacancyDtos: any[]): Vacancy[] {
    return vacancyDtos.map(dto => {
      // Создаем Value Objects
      const skills = dto.skills?.map((skillName: string) => new Skill(skillName)) || [];
      const salary = new Salary(dto.salaryFrom, dto.salaryTo, dto.salaryCurrency);
      const company = new Company(dto.company, dto.companyTrusted || false);

      // Создаем domain entity
      return new Vacancy(
        dto._id || dto.id,
        dto.title,
        company,
        skills,
        salary,
        new Date(dto.publishedAt),
        dto.source,
        dto.location,
        dto.description,
        dto.experience,
        dto.employment
      );
    });
  }
}
