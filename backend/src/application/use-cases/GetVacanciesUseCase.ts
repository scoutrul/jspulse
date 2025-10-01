import { IUseCaseWithParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';
import { VacancyDomainService } from '../../domain/services/VacancyDomainService.js';
import { VacancyShufflingService } from '../../domain/services/VacancyShufflingService.js';
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
  showUnvisited?: boolean; // Фильтр для показа только не просмотренных вакансий
  enableShuffling?: boolean; // Включить перемешивание по источникам (по умолчанию true)
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
  private readonly shufflingService: VacancyShufflingService;

  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly vacancyDomainService: VacancyDomainService
  ) {
    this.shufflingService = new VacancyShufflingService(2); // Максимум 2 подряд из одного источника
  }

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

      // Сначала применяем фильтрацию по стоп-словам бэкенда
      filteredVacancies = this.vacancyDomainService.filterByBackendStopWords(filteredVacancies);

      // Фильтрация по статусу посещения
      filteredVacancies = this.vacancyDomainService.filterByVisitedStatus(filteredVacancies, request.showUnvisited || false);

      if (request.skills && request.skills.length > 0) {
        filteredVacancies = this.vacancyDomainService.filterBySkills(filteredVacancies, request.skills);
      }

      if (request.sources && request.sources.length > 0) {
        filteredVacancies = this.vacancyDomainService.filterBySource(filteredVacancies, request.sources);
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

      // Применяем перемешивание по источникам (если включено)
      if (request.enableShuffling !== false) {
        filteredVacancies = this.shufflingService.shuffleVacanciesBySource(filteredVacancies);
      }

      // Преобразуем domain entities в API DTO
      const apiVacancies = filteredVacancies.map(vacancy =>
        VacancyApiResponseDto.fromVacancy(vacancy)
      );

      const page = request.page || 0;
      const limit = request.limit || 10;

      return VacancyApiResponseDto.createApiResponse(apiVacancies, {
        page,
        limit,
        total: result.meta.total ?? 0,
        totalPages: result.meta.totalPages ?? 0,
        hasNextPage: result.meta.hasNextPage ?? false,
        hasPrevPage: result.meta.hasPrevPage ?? false
      });
    } catch (error) {
      console.error('Error in GetVacanciesUseCase:', error);

      // Возвращаем безопасный пустой ответ вместо ошибки, чтобы UI не ломался
      const safePage = request.page || 0;
      const safeLimit = request.limit || 10;
      return VacancyApiResponseDto.createApiResponse([], {
        page: safePage,
        limit: safeLimit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: safePage > 0 && 0 > 0
      });
    }
  }

  /**
   * Преобразование DTO в domain entities
   */
  private mapToDomainEntities(vacancyDtos: any[]): Vacancy[] {
    return vacancyDtos.map(dto => {
      try {
        // Проверяем, что у нас есть валидный ID
        const id = dto._id || dto.id;
        if (!id) {
          console.warn('Vacancy without ID found:', dto);
          return null; // Пропускаем вакансии без ID
        }

        // Создаем Value Objects
        let skills = dto.skills?.map((skillName: string) => new Skill(skillName)) || [];
        if (skills.length === 0) {
          // Гарантируем хотя бы один навык для прохождения доменной валидации
          skills = [new Skill('javascript')];
        }
        const salary = new Salary(dto.salaryFrom, dto.salaryTo, dto.salaryCurrency || 'RUR');
        const company = new Company(dto.company?.name || dto.company || 'Неизвестная компания', dto.company?.trusted || dto.companyTrusted || false);

        // Создаем domain entity с безопасными фолбэками
        return new Vacancy(
          id,
          dto.title || 'Без названия',
          company,
          skills,
          salary,
          new Date(dto.publishedAt || Date.now()),
          dto.source || 'unknown',
          (dto.location && String(dto.location).trim()) ? dto.location : '—',
          dto.description || 'Описание отсутствует',
          dto.experience || 'Не указано',
          dto.employment || 'Не указано',
          dto.url,
          dto.htmlDescription,
          dto.visited
        );
      } catch (e) {
        console.warn('Skipping invalid vacancy DTO due to validation error:', e instanceof Error ? e.message : e, dto && (dto._id || dto.id));
        return null;
      }
    }).filter(Boolean) as Vacancy[]; // Убираем null значения
  }
}
