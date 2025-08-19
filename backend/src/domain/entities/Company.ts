/**
 * Value Object для компании
 */
export class Company {
  constructor(
    private readonly _name: string,
    private readonly _trusted: boolean = false
  ) {
    this.validate();
  }

  get name(): string { return this._name; }
  get trusted(): boolean { return this._trusted; }

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Company name cannot be empty');
    }
    if (this._name.length > 200) {
      throw new Error('Company name cannot exceed 200 characters');
    }
  }

  isTrusted(): boolean {
    return this._trusted;
  }

  toJSON(): { name: string; trusted: boolean } {
    return {
      name: this._name,
      trusted: this._trusted
    };
  }
}
