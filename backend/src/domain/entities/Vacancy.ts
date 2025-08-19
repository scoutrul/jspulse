import { Skill } from './Skill.js';
import { Salary } from './Salary.js';
import { Company } from './Company.js';

/**
 * Domain Entity для вакансии
 * Содержит бизнес-правила и валидацию
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
    private readonly _location?: string,
    private readonly _description?: string,
    private readonly _experience?: string,
    private readonly _employment?: string
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
  get location(): string | undefined { return this._location; }
  get description(): string | undefined { return this._description; }
  get experience(): string | undefined { return this._experience; }
  get employment(): string | undefined { return this._employment; }

  /**
   * Валидация вакансии
   */
  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('Vacancy ID cannot be empty');
    }
    if (!this._title || this._title.trim().length === 0) {
      throw new Error('Vacancy title cannot be empty');
    }
    if (this._title.length > 500) {
      throw new Error('Vacancy title cannot exceed 500 characters');
    }
    if (this._skills.length === 0) {
      throw new Error('Vacancy must have at least one skill');
    }
    if (this._publishedAt > new Date()) {
      throw new Error('Published date cannot be in the future');
    }
  }

  /**
   * Бизнес-правила
   */
  isActive(): boolean {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this._publishedAt > thirtyDaysAgo;
  }

  isArchived(): boolean {
    return !this.isActive();
  }

  hasSkill(skillName: string): boolean {
    return this._skills.some(skill => skill.matches(skillName));
  }

  hasAnySkill(skillNames: string[]): boolean {
    return skillNames.some(skillName => this.hasSkill(skillName));
  }

  isHighSalary(): boolean {
    return this._salary.isHighSalary();
  }

  isRemote(): boolean {
    if (!this._location) return false;
    const location = this._location.toLowerCase();
    return location.includes('удаленно') ||
      location.includes('remote') ||
      location.includes('удаленка');
  }

  isOffice(): boolean {
    if (!this._location) return false;
    const location = this._location.toLowerCase();
    return location.includes('офис') ||
      location.includes('office') ||
      !this.isRemote();
  }

  /**
   * Создание копии с изменениями
   */
  withSkills(skills: Skill[]): Vacancy {
    return new Vacancy(
      this._id,
      this._title,
      this._company,
      skills,
      this._salary,
      this._publishedAt,
      this._source,
      this._location,
      this._description,
      this._experience,
      this._employment
    );
  }

  withSalary(salary: Salary): Vacancy {
    return new Vacancy(
      this._id,
      this._title,
      this._company,
      this._skills,
      salary,
      this._publishedAt,
      this._source,
      this._location,
      this._description,
      this._experience,
      this._employment
    );
  }

  /**
   * Преобразование в простой объект для сериализации
   */
  toJSON(): Record<string, any> {
    return {
      id: this._id,
      title: this._title,
      company: this._company.toJSON(),
      skills: this._skills.map(skill => skill.toJSON()),
      salary: this._salary.toJSON(),
      publishedAt: this._publishedAt.toISOString(),
      source: this._source,
      location: this._location,
      description: this._description,
      experience: this._experience,
      employment: this._employment,
      isActive: this.isActive(),
      isHighSalary: this.isHighSalary(),
      isRemote: this.isRemote(),
      isOffice: this.isOffice()
    };
  }
}
