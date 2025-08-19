/**
 * Value Object для компании
 * Инкапсулирует логику работы с компанией
 */
export class Company {
  constructor(
    private readonly _name: string,
    private readonly _trusted: boolean = false
  ) {
    this.validate();
  }

  get name(): string {
    return this._name;
  }

  get trusted(): boolean {
    return this._trusted;
  }

  /**
   * Проверяет, является ли компания доверенной
   */
  isTrusted(): boolean {
    return this._trusted;
  }

  /**
   * Валидация данных
   */
  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Название компании не может быть пустым');
    }

    if (this._name.trim().length < 2) {
      throw new Error('Название компании должно содержать минимум 2 символа');
    }
  }
}
