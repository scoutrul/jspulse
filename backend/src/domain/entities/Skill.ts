/**
 * Domain Entity для навыков
 * Содержит бизнес-правила и валидацию
 */
export class Skill {
  constructor(
    private readonly _name: string,
    private readonly _category?: string
  ) {
    this.validate();
  }

  get name(): string {
    return this._name;
  }

  get category(): string | undefined {
    return this._category;
  }

  /**
   * Валидация навыка
   */
  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Skill name cannot be empty');
    }

    if (this._name.length > 100) {
      throw new Error('Skill name cannot exceed 100 characters');
    }
  }

  /**
   * Нормализация названия навыка
   */
  get normalizedName(): string {
    return this._name.toLowerCase().trim();
  }

  /**
   * Проверка соответствия навыка
   */
  matches(searchTerm: string): boolean {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return this.normalizedName.includes(normalizedSearch) ||
      normalizedSearch.includes(this.normalizedName);
  }

  /**
   * Сравнение навыков
   */
  equals(other: Skill): boolean {
    return this.normalizedName === other.normalizedName;
  }

  /**
   * Создание копии с изменениями
   */
  withCategory(category: string): Skill {
    return new Skill(this._name, category);
  }

  /**
   * Преобразование в строку
   */
  toString(): string {
    return this._name;
  }

  /**
   * Преобразование в простой объект для сериализации
   */
  toJSON(): { name: string; category?: string } {
    return {
      name: this._name,
      category: this._category
    };
  }
}
