import { Vacancy } from '../../domain/entities/Vacancy.js';

/**
 * DTO для API ответа вакансии
 * Преобразует domain entities в формат, ожидаемый фронтендом
 */
export class VacancyApiResponseDto {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly company: string, // Плоская строка вместо объекта
    public readonly skills: string[], // Массив строк вместо объектов
    public readonly salary: {
      from?: number;
      to?: number;
      currency: string;
    },
    public readonly publishedAt: string,
    public readonly source: string,
    public readonly location: string,
    public readonly description: string,
    public readonly experience: string,
    public readonly employment: string,
    public readonly isActive: boolean,
    public readonly isHighSalary: boolean,
    public readonly isRemote: boolean,
    public readonly isOffice: boolean,
    public readonly url?: string, // Добавляем URL для совместимости
    public readonly htmlDescription?: string,
    public readonly visited?: boolean // Поле для отслеживания посещений
  ) { }

  /**
   * Создает DTO из domain entity
   */
  static fromVacancy(vacancy: Vacancy): VacancyApiResponseDto {
    return new VacancyApiResponseDto(
      vacancy.id, // Канонический id
      vacancy.title,
      vacancy.company.name, // Извлекаем только имя компании
      vacancy.skills.map(skill => skill.name), // Извлекаем только названия навыков
      {
        from: vacancy.salary.from,
        to: vacancy.salary.to,
        currency: vacancy.salary.currency
      },
      vacancy.publishedAt.toISOString(),
      vacancy.source,
      vacancy.location,
      vacancy.description,
      vacancy.experience,
      vacancy.employment,
      vacancy.isActive(),
      vacancy.isHighSalary(),
      vacancy.isRemote(),
      vacancy.isOffice(),
      vacancy.url || `https://hh.ru/vacancy/${vacancy.id}`, // Генерируем URL если нет
      vacancy.htmlDescription,
      vacancy.visited
    );
  }

  /**
   * Преобразует в объект для JSON
   */
  toApiResponse() {
    return {
      id: this.id,
      title: this.title,
      company: this.company,
      skills: this.skills,
      // Плоские поля зарплаты для совместимости с фронтендом
      salaryFrom: this.salary.from,
      salaryTo: this.salary.to,
      salaryCurrency: this.salary.currency,
      publishedAt: this.publishedAt,
      source: this.source,
      location: this.location,
      description: this.description,
      experience: this.experience,
      employment: this.employment,
      isActive: this.isActive,
      isHighSalary: this.isHighSalary,
      isRemote: this.isRemote,
      isOffice: this.isOffice,
      url: this.url,
      htmlDescription: this.htmlDescription,
      visited: this.visited
    };
  }

  /**
   * Создает полный API ответ с метаданными
   */
  static createApiResponse(vacancies: VacancyApiResponseDto[], meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }) {
    return {
      success: true,
      data: vacancies.map(dto => dto.toApiResponse()),
      meta: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPages,
        hasNextPage: meta.hasNextPage,
        hasPrevPage: meta.hasPrevPage,
        totalItems: meta.total // Добавляем totalItems для совместимости с фронтендом
      }
    };
  }
}
