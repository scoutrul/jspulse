import { promises as fs } from 'fs';
import { join } from 'path';
import type { SessionData } from '@jspulse/shared';
import { TELEGRAM_CONFIG } from '../../config/telegram.js';

/**
 * Менеджер для управления Telegram сессиями
 * Обеспечивает безопасное хранение и восстановление сессий
 */
export class SessionManager {
  private readonly sessionDir: string;
  private readonly sessionFile: string;
  private cachedSession: SessionData | null = null;

  constructor() {
    // Путь к директории для хранения сессий
    this.sessionDir = join(process.cwd(), 'data', 'telegram');
    this.sessionFile = join(this.sessionDir, 'session.json');
  }

  /**
   * Инициализация директории для сессий
   */
  private async ensureSessionDir(): Promise<void> {
    try {
      await fs.access(this.sessionDir);
    } catch {
      await fs.mkdir(this.sessionDir, { recursive: true });
      console.log(`📁 Created session directory: ${this.sessionDir}`);
    }
  }

  /**
   * Сохранение сессии в файл
   */
  async saveSession(sessionData: Partial<SessionData>): Promise<void> {
    await this.ensureSessionDir();

    const session: SessionData = {
      apiId: sessionData.apiId || TELEGRAM_CONFIG.API_ID,
      apiHash: sessionData.apiHash || TELEGRAM_CONFIG.API_HASH,
      sessionString: sessionData.sessionString || '',
      userId: sessionData.userId || 0,
      username: sessionData.username,
      createdAt: sessionData.createdAt || new Date(),
      lastUsed: new Date()
    };

    await fs.writeFile(this.sessionFile, JSON.stringify(session, null, 2), 'utf-8');
    this.cachedSession = session;

    console.log(`💾 Session saved for user: ${session.username || session.userId}`);
  }

  /**
   * Загрузка сессии из файла
   */
  async loadSession(): Promise<SessionData | null> {
    if (this.cachedSession) {
      return this.cachedSession;
    }

    try {
      const sessionData = await fs.readFile(this.sessionFile, 'utf-8');
      const session: SessionData = JSON.parse(sessionData);

      // Обновляем время последнего использования
      session.lastUsed = new Date();
      await this.saveSession(session);

      this.cachedSession = session;
      console.log(`📱 Session loaded for user: ${session.username || session.userId}`);

      return session;
    } catch (error) {
      console.log(`📭 No saved session found: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Получение session string из конфигурации или файла
   */
  async getSessionString(): Promise<string | null> {
    // Сначала проверяем environment variables
    if (TELEGRAM_CONFIG.SESSION_STRING) {
      return TELEGRAM_CONFIG.SESSION_STRING;
    }

    // Затем пытаемся загрузить из файла
    const session = await this.loadSession();
    return session?.sessionString || null;
  }

  /**
   * Проверка валидности сессии
   */
  async isSessionValid(): Promise<boolean> {
    const sessionString = await this.getSessionString();
    if (!sessionString) {
      return false;
    }

    // Если session string получен из переменных окружения, считаем его валидным
    if (TELEGRAM_CONFIG.SESSION_STRING && sessionString === TELEGRAM_CONFIG.SESSION_STRING) {
      return true;
    }

    // Иначе проверяем файл сессии
    const session = await this.loadSession();
    if (!session) {
      return false;
    }

    // Проверяем возраст сессии (сессии Telegram обычно живут долго, но лучше проверить)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней
    const sessionAge = Date.now() - session.lastUsed.getTime();

    return sessionAge < maxAge;
  }

  /**
   * Удаление сессии
   */
  async clearSession(): Promise<void> {
    try {
      await fs.unlink(this.sessionFile);
      this.cachedSession = null;
      console.log(`🗑️ Session cleared`);
    } catch (error) {
      console.log(`⚠️ Error clearing session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Получение информации о сессии для логирования
   */
  async getSessionInfo(): Promise<{
    exists: boolean;
    valid: boolean;
    userId?: number;
    username?: string;
    lastUsed?: Date;
  }> {
    const sessionString = await this.getSessionString();
    const valid = await this.isSessionValid();

    // Если используется session string из переменных окружения
    if (TELEGRAM_CONFIG.SESSION_STRING && sessionString === TELEGRAM_CONFIG.SESSION_STRING) {
      return {
        exists: true,
        valid,
        userId: undefined,
        username: 'from_env_variable',
        lastUsed: new Date()
      };
    }

    // Иначе проверяем файл сессии
    const session = await this.loadSession();
    return {
      exists: !!session,
      valid,
      userId: session?.userId,
      username: session?.username,
      lastUsed: session?.lastUsed
    };
  }

  /**
   * Обновление времени последнего использования
   */
  async updateLastUsed(): Promise<void> {
    if (this.cachedSession) {
      this.cachedSession.lastUsed = new Date();
      await this.saveSession(this.cachedSession);
    }
  }
} 