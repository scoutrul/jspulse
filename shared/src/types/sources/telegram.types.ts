/**
 * Типы для Telegram парсинга вакансий
 */

export interface TelegramConfig {
  apiId: number;
  apiHash: string;
  sessionString?: string;
  channels: readonly string[];
  parseSchedule: string;
  maxMessages: number;
  keyWords: readonly string[];
  salaryPatterns: RegExp[];
  companyPatterns: RegExp[];
  locationPatterns: RegExp[];
  skillsPatterns: RegExp[];
  enabled: boolean;
  retryAttempts?: number;
  timeout?: number;
}

export interface TelegramMessage {
  id: number;
  text: string;
  date: Date;
  channelId: string;
  channelUsername: string;
  from?: {
    id: number;
    username?: string;
    firstName?: string;
  };
}

export interface TelegramParsingResult {
  message: TelegramMessage;
  extractedData: {
    title?: string;
    company?: string;
    location?: string;
    salary?: {
      from?: number;
      to?: number;
      currency?: string;
    };
    skills?: string[];
    description: string;
    contact?: string;
    confidence: number; // 0-1, уверенность в корректности парсинга
  };
  valid: boolean;
  errors?: string[];
}

export interface TelegramChannelInfo {
  id: string;
  username: string;
  title: string;
  membersCount?: number;
  lastMessageId?: number;
  isActive: boolean;
}

export interface TelegramParsingStats {
  totalMessages: number;
  validVacancies: number;
  duplicatesSkipped: number;
  errorRate: number;
  lastRun: Date;
  channelStats: Record<string, {
    messages: number;
    vacancies: number;
    errors: number;
  }>;
}

export interface TelegramAuthData {
  phone?: string;
  code?: string;
  password?: string;
  sessionString?: string;
}

export interface SessionData {
  apiId: number;
  apiHash: string;
  sessionString: string;
  userId: number;
  username?: string;
  createdAt: Date;
  lastUsed: Date;
} 