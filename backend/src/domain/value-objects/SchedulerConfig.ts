/**
 * Value Object для конфигурации Scheduler
 * Инкапсулирует настройки планировщика
 */
export class SchedulerConfig {
  constructor(
    private readonly _hhParserSchedule: string,
    private readonly _hhParserEnabled: boolean,
    private readonly _cleanupSchedule: string,
    private readonly _cleanupEnabled: boolean,
    private readonly _cleanupDaysThreshold: number,
    private readonly _healthCheckSchedule: string,
    private readonly _healthCheckEnabled: boolean,
    private readonly _maxRetries: number,
    private readonly _retryDelay: number,
    private readonly _enableNotifications: boolean,
    private readonly _logToFile: boolean
  ) {
    this.validate();
  }

  // Getters
  get hhParserSchedule(): string { return this._hhParserSchedule; }
  get hhParserEnabled(): boolean { return this._hhParserEnabled; }
  get cleanupSchedule(): string { return this._cleanupSchedule; }
  get cleanupEnabled(): boolean { return this._cleanupEnabled; }
  get cleanupDaysThreshold(): number { return this._cleanupDaysThreshold; }
  get healthCheckSchedule(): string { return this._healthCheckSchedule; }
  get healthCheckEnabled(): boolean { return this._healthCheckEnabled; }
  get maxRetries(): number { return this._maxRetries; }
  get retryDelay(): number { return this._retryDelay; }
  get enableNotifications(): boolean { return this._enableNotifications; }
  get logToFile(): boolean { return this._logToFile; }

  /**
   * Создает конфигурацию по умолчанию
   */
  static createDefault(): SchedulerConfig {
    return new SchedulerConfig(
      process.env.SCHEDULER_HH_PARSER_SCHEDULE || '0 9,15,21 * * *',
      process.env.SCHEDULER_HH_PARSER_ENABLED === 'true' || true,
      process.env.SCHEDULER_CLEANUP_SCHEDULE || '0 2 * * 0',
      process.env.SCHEDULER_CLEANUP_ENABLED === 'true' || true,
      parseInt(process.env.SCHEDULER_CLEANUP_DAYS_THRESHOLD || '30'),
      process.env.SCHEDULER_HEALTH_CHECK_SCHEDULE || '*/10 * * * *',
      process.env.SCHEDULER_HEALTH_CHECK_ENABLED === 'true' || true,
      parseInt(process.env.SCHEDULER_MAX_RETRIES || '3'),
      parseInt(process.env.SCHEDULER_RETRY_DELAY || '60000'),
      process.env.SCHEDULER_ENABLE_NOTIFICATIONS === 'true' || true,
      process.env.SCHEDULER_LOG_TO_FILE === 'true' || true
    );
  }

  /**
   * Создает конфигурацию с обновлениями
   */
  withUpdates(updates: Partial<{
    hhParserSchedule: string;
    hhParserEnabled: boolean;
    cleanupSchedule: string;
    cleanupEnabled: boolean;
    cleanupDaysThreshold: number;
    healthCheckSchedule: string;
    healthCheckEnabled: boolean;
    maxRetries: number;
    retryDelay: number;
    enableNotifications: boolean;
    logToFile: boolean;
  }>): SchedulerConfig {
    return new SchedulerConfig(
      updates.hhParserSchedule ?? this._hhParserSchedule,
      updates.hhParserEnabled ?? this._hhParserEnabled,
      updates.cleanupSchedule ?? this._cleanupSchedule,
      updates.cleanupEnabled ?? this._cleanupEnabled,
      updates.cleanupDaysThreshold ?? this._cleanupDaysThreshold,
      updates.healthCheckSchedule ?? this._healthCheckSchedule,
      updates.healthCheckEnabled ?? this._healthCheckEnabled,
      updates.maxRetries ?? this._maxRetries,
      updates.retryDelay ?? this._retryDelay,
      updates.enableNotifications ?? this._enableNotifications,
      updates.logToFile ?? this._logToFile
    );
  }

  /**
   * Валидация данных
   */
  private validate(): void {
    if (this._maxRetries < 1) {
      throw new Error('Max retries must be at least 1');
    }

    if (this._retryDelay < 1000) {
      throw new Error('Retry delay must be at least 1000ms');
    }

    if (this._cleanupDaysThreshold < 1) {
      throw new Error('Cleanup days threshold must be at least 1');
    }

    // Валидация cron выражений (базовая)
    if (!this._hhParserSchedule || this._hhParserSchedule.trim().length === 0) {
      throw new Error('HH Parser schedule cannot be empty');
    }

    if (!this._cleanupSchedule || this._cleanupSchedule.trim().length === 0) {
      throw new Error('Cleanup schedule cannot be empty');
    }

    if (!this._healthCheckSchedule || this._healthCheckSchedule.trim().length === 0) {
      throw new Error('Health check schedule cannot be empty');
    }
  }
}
