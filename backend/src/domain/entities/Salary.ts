/**
 * Value Object для зарплаты
 */
export class Salary {
  constructor(
    private readonly _from?: number,
    private readonly _to?: number,
    private readonly _currency: string = 'RUR'
  ) {
    this.validate();
  }

  get from(): number | undefined { return this._from; }
  get to(): number | undefined { return this._to; }
  get currency(): string { return this._currency; }

  private validate(): void {
    if (this._from !== undefined && this._from < 0) {
      throw new Error('Salary from cannot be negative');
    }
    if (this._to !== undefined && this._to < 0) {
      throw new Error('Salary to cannot be negative');
    }
    if (this._from !== undefined && this._to !== undefined && this._from > this._to) {
      throw new Error('Salary from cannot be greater than salary to');
    }
  }

  get average(): number | undefined {
    if (this._from !== undefined && this._to !== undefined) {
      return Math.round((this._from + this._to) / 2);
    }
    return this._from || this._to;
  }

  isHighSalary(): boolean {
    const avg = this.average;
    if (!avg) return false;

    // Бизнес-правило: высокая зарплата от 150k рублей
    if (this._currency === 'RUR') return avg >= 150000;
    if (this._currency === 'USD') return avg >= 2000;
    if (this._currency === 'EUR') return avg >= 1800;

    return false;
  }

  toJSON(): { from?: number; to?: number; currency: string } {
    return {
      from: this._from,
      to: this._to,
      currency: this._currency
    };
  }
}
