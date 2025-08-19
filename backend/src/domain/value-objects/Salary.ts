/**
 * Value Object для зарплаты
 * Инкапсулирует логику работы с зарплатой
 */
export class Salary {
  constructor(
    private readonly _from?: number,
    private readonly _to?: number,
    private readonly _currency: string = 'RUR'
  ) {
    this.validate();
  }

  get from(): number | undefined {
    return this._from;
  }

  get to(): number | undefined {
    return this._to;
  }

  get currency(): string {
    return this._currency;
  }

  /**
   * Средняя зарплата
   */
  get average(): number | undefined {
    if (this._from && this._to) {
      return Math.round((this._from + this._to) / 2);
    }
    return this._from || this._to;
  }

  /**
   * Проверяет, является ли зарплата высокой (> 200k RUR)
   */
  isHighSalary(): boolean {
    const avg = this.average;
    return avg ? avg > 200000 : false;
  }

  /**
   * Валидация данных
   */
  private validate(): void {
    if (this._from && this._to && this._from > this._to) {
      throw new Error('Минимальная зарплата не может быть больше максимальной');
    }

    if (this._from && this._from < 0) {
      throw new Error('Зарплата не может быть отрицательной');
    }

    if (this._to && this._to < 0) {
      throw new Error('Зарплата не может быть отрицательной');
    }
  }
}
