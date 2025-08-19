import { IUseCaseWithoutParams } from '../interfaces/IUseCase.js';
import { ScheduledJob } from '../../domain/entities/ScheduledJob.js';

/**
 * DTO для ответа статуса Scheduler
 */
export interface SchedulerStatusResponse {
  status: 'healthy' | 'unhealthy' | 'stopped';
  totalJobs: number;
  runningJobs: number;
  lastError?: Date;
  uptime: number;
  jobs: Array<{
    id: string;
    name: string;
    schedule: string;
    enabled: boolean;
    running: boolean;
    lastRun?: Date;
    lastSuccess?: Date;
    lastError?: Date;
    runCount: number;
    successCount: number;
    errorCount: number;
    successRate: number;
  }>;
}

/**
 * Use Case для получения статуса Scheduler
 * Заменяет бизнес-логику из старого SchedulerService
 */
export class GetSchedulerStatusUseCase implements IUseCaseWithoutParams<SchedulerStatusResponse> {
  constructor(
    private readonly scheduledJobs: ScheduledJob[],
    private readonly startTime: number,
    private readonly isShuttingDown: boolean
  ) { }

  async execute(): Promise<SchedulerStatusResponse> {
    const runningJobs = this.scheduledJobs.filter(job => job.running);
    const jobs = this.scheduledJobs;

    const lastErrorDate = jobs
      .map(job => job.lastError)
      .filter(Boolean)
      .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0];

    return {
      status: this.isShuttingDown ? 'stopped' : 'healthy',
      totalJobs: jobs.length,
      runningJobs: runningJobs.length,
      lastError: lastErrorDate,
      uptime: Date.now() - this.startTime,
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        schedule: job.schedule,
        enabled: job.enabled,
        running: job.running,
        lastRun: job.lastRun,
        lastSuccess: job.lastSuccess,
        lastError: job.lastError,
        runCount: job.runCount,
        successCount: job.successCount,
        errorCount: job.errorCount,
        successRate: job.getSuccessRate()
      }))
    };
  }
}
