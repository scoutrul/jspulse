/**
 * Domain Entity для запланированной задачи
 * Инкапсулирует бизнес-логику работы с задачами
 */
export class ScheduledJob {
  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private _schedule: string, // Убираю readonly для возможности изменения
    private _enabled: boolean,
    private _running: boolean = false,
    private _lastRun?: Date,
    private _lastSuccess?: Date,
    private _lastError?: Date,
    private _runCount: number = 0,
    private _successCount: number = 0,
    private _errorCount: number = 0
  ) {
    this.validate();
  }

  // Getters
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get schedule(): string { return this._schedule; }
  get enabled(): boolean { return this._enabled; }
  get running(): boolean { return this._running; }
  get lastRun(): Date | undefined { return this._lastRun; }
  get lastSuccess(): Date | undefined { return this._lastSuccess; }
  get lastError(): Date | undefined { return this._lastError; }
  get runCount(): number { return this._runCount; }
  get successCount(): number { return this._successCount; }
  get errorCount(): number { return this._errorCount; }

  // Business methods
  /**
   * Проверяет, может ли задача быть запущена
   */
  canRun(): boolean {
    return this._enabled && !this._running;
  }

  /**
   * Проверяет, является ли задача активной
   */
  isActive(): boolean {
    return this._enabled && !this._running;
  }

  /**
   * Проверяет, есть ли ошибки в последних запусках
   */
  hasRecentErrors(): boolean {
    if (!this._lastError) return false;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this._lastError > oneHourAgo;
  }

  /**
   * Получает успешность выполнения задачи
   */
  getSuccessRate(): number {
    if (this._runCount === 0) return 0;
    return (this._successCount / this._runCount) * 100;
  }

  // State management methods
  /**
   * Запускает задачу
   */
  start(): void {
    if (!this.canRun()) {
      throw new Error(`Cannot start job ${this._name}: not enabled or already running`);
    }
    this._running = true;
    this._runCount++;
    this._lastRun = new Date();
  }

  /**
   * Завершает задачу успешно
   */
  completeSuccess(): void {
    if (!this._running) {
      throw new Error(`Cannot complete job ${this._name}: not running`);
    }
    this._running = false;
    this._successCount++;
    this._lastSuccess = new Date();
  }

  /**
   * Завершает задачу с ошибкой
   */
  completeWithError(): void {
    if (!this._running) {
      throw new Error(`Cannot complete job ${this._name}: not running`);
    }
    this._running = false;
    this._errorCount++;
    this._lastError = new Date();
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(enabled: boolean, schedule?: string): void {
    this._enabled = enabled;
    if (schedule) {
      this._schedule = schedule;
    }
  }

  /**
   * Валидация данных
   */
  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new Error('Job ID cannot be empty');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Job name cannot be empty');
    }

    if (!this._schedule || this._schedule.trim().length === 0) {
      throw new Error('Job schedule cannot be empty');
    }

    if (this._runCount < 0) {
      throw new Error('Run count cannot be negative');
    }

    if (this._successCount < 0) {
      throw new Error('Success count cannot be negative');
    }

    if (this._errorCount < 0) {
      throw new Error('Error count cannot be negative');
    }
  }
}
