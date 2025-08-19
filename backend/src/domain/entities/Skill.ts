/**
 * Domain Entity для навыка
 * Инкапсулирует бизнес-логику работы с навыками
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
   * Нормализованное название навыка (для поиска)
   */
  get normalizedName(): string {
    return this._name.toLowerCase().trim();
  }

  /**
   * Проверяет, соответствует ли навык поисковому запросу
   */
  matches(searchTerm: string): boolean {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    return this.normalizedName.includes(normalizedSearch);
  }

  /**
   * Валидация данных
   */
  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Название навыка не может быть пустым');
    }

    if (this._name.trim().length < 2) {
      throw new Error('Название навыка должно содержать минимум 2 символа');
    }
  }
}
