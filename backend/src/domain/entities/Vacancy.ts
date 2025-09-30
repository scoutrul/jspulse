import { Skill } from './Skill.js';
import { Salary } from '../value-objects/Salary.js';
import { Company } from '../value-objects/Company.js';

/**
 * Domain Entity для вакансии
 * Инкапсулирует бизнес-логику и правила валидации
 */
export class Vacancy {
  constructor(
    private readonly _id: string,
    private readonly _title: string,
    private readonly _company: Company,
    private readonly _skills: Skill[],
    private readonly _salary: Salary,
    private readonly _publishedAt: Date,
    private readonly _source: string,
    private readonly _location: string,
    private readonly _description: string,
    private readonly _experience: string,
    private readonly _employment: string,
    private readonly _url?: string,
    private readonly _htmlDescription?: string,
    private readonly _visited?: boolean
  ) {
    this.validate();
  }

  // Getters
  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get company(): Company { return this._company; }
  get skills(): Skill[] { return this._skills; }
  get salary(): Salary { return this._salary; }
  get publishedAt(): Date { return this._publishedAt; }
  get source(): string { return this._source; }
  get location(): string { return this._location; }
  get description(): string { return this._description; }
  get experience(): string { return this._experience; }
  get employment(): string { return this._employment; }
  get url(): string | undefined { return this._url; }
  get htmlDescription(): string | undefined { return this._htmlDescription; }
  get visited(): boolean | undefined { return this._visited; }

  /**
   * Проверяет, активна ли вакансия (опубликована в последние 30 дней)
   */
  isActive(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this._publishedAt > thirtyDaysAgo;
  }

  /**
   * Проверяет, является ли зарплата высокой
   */
  isHighSalary(): boolean {
    return this._salary.isHighSalary();
  }

  /**
   * Проверяет, является ли вакансия удаленной
   */
  isRemote(): boolean {
    if (!this._location) return false;
    const location = this._location.toLowerCase();
    return location.includes('удаленно') ||
      location.includes('remote') ||
      location.includes('удаленка');
  }

  /**
   * Проверяет, является ли вакансия офисной
   */
  isOffice(): boolean {
    if (!this._location) return false;
    const location = this._location.toLowerCase();
    return location.includes('офис') ||
      location.includes('office') ||
      !(location.includes('удаленно') ||
        location.includes('remote') ||
        location.includes('удаленка'));
  }

  /**
   * Проверяет, содержит ли вакансия указанный навык
   */
  hasSkill(skillName: string): boolean {
    return this._skills.some(skill =>
      skill.name.toLowerCase() === skillName.toLowerCase()
    );
  }

  /**
   * Валидация данных
   */
  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('ID вакансии не может быть пустым');
    }

    if (!this._title || this._title.trim().length === 0) {
      throw new Error('Название вакансии не может быть пустым');
    }

    if (!this._company) {
      throw new Error('Компания обязательна');
    }

    if (!this._skills || this._skills.length === 0) {
      throw new Error('Вакансия должна содержать хотя бы один навык');
    }

    if (!this._salary) {
      throw new Error('Информация о зарплате обязательна');
    }

    if (!this._publishedAt) {
      throw new Error('Дата публикации обязательна');
    }

    if (!this._source || this._source.trim().length === 0) {
      throw new Error('Источник вакансии обязателен');
    }

    if (!this._location || this._location.trim().length === 0) {
      throw new Error('Локация вакансии обязательна');
    }

    if (!this._description || this._description.trim().length === 0) {
      throw new Error('Описание вакансии обязательно');
    }

    if (!this._experience || this._experience.trim().length === 0) {
      throw new Error('Требования к опыту обязательны');
    }

    if (!this._employment || this._employment.trim().length === 0) {
      throw new Error('Тип занятости обязателен');
    }
  }
}
