export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
  timestamp: string;
}

export interface ParsingLog {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

export interface SystemStats {
  vacancies: {
    total: number;
    recent24h: number;
    withFullDescription: number;
  };
  skills: {
    unique: number;
    total: number;
  };
  cache: {
    hitRate: number;
    size: number;
    totalRequests: number;
  };
  scheduler: {
    status: string;
    lastRun: string;
  };
  system: {
    uptime: number;
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
    };
  };
}

export interface AdminState {
  loading: boolean;
  error: string | null;
  stats: SystemStats | null;
  recentVacancies: any[];
  documentationFiles: any[];
}

export interface ConfirmDialogState {
  show: boolean;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
} 