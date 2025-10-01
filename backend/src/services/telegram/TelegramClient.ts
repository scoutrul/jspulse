import { TelegramClient as MTProtoClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/api.js';
import type { TelegramMessage, TelegramChannelInfo, TelegramConfig } from '@jspulse/shared';
import { TELEGRAM_CONFIG } from '../../config/telegram.js';
import { SessionManager } from './SessionManager.js';

/**
 * Преобразование конфигурации к нужному формату
 */
const createTelegramConfig = (): TelegramConfig => ({
  apiId: TELEGRAM_CONFIG.API_ID,
  apiHash: TELEGRAM_CONFIG.API_HASH,
  sessionString: TELEGRAM_CONFIG.SESSION_STRING,
  channels: TELEGRAM_CONFIG.CHANNELS,
  parseSchedule: TELEGRAM_CONFIG.PARSE_SCHEDULE,
  maxMessages: TELEGRAM_CONFIG.MAX_MESSAGES,
  keyWords: TELEGRAM_CONFIG.KEYWORDS.REQUIRED,
  salaryPatterns: [TELEGRAM_CONFIG.PARSING.SALARY_REGEX],
  companyPatterns: [TELEGRAM_CONFIG.PARSING.COMPANY_REGEX],
  locationPatterns: [TELEGRAM_CONFIG.PARSING.LOCATION_REGEX],
  skillsPatterns: [TELEGRAM_CONFIG.PARSING.SKILLS_REGEX],
  enabled: TELEGRAM_CONFIG.PARSER_ENABLED,
  retryAttempts: TELEGRAM_CONFIG.RETRY_ATTEMPTS,
  timeout: TELEGRAM_CONFIG.TIMEOUT
});

/**
 * Клиент для работы с Telegram API
 * Обеспечивает подключение, авторизацию и получение сообщений из каналов
 */
export class TelegramClient {
  private client: MTProtoClient | null = null;
  private sessionManager: SessionManager;
  private isConnected: boolean = false;
  private rateLimitDelay: number = TELEGRAM_CONFIG.REQUEST_DELAY;

  constructor(private config: TelegramConfig = createTelegramConfig()) {
    this.sessionManager = new SessionManager();
  }

  /**
   * Подключение к Telegram API
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log('📱 Already connected to Telegram');
      return;
    }

    try {
      console.log('📱 Connecting to Telegram...');

      // Получаем session string: сначала из менеджера (файл), затем из env/config
      const fileSession = await this.sessionManager.getSessionString();
      const sessionString = (fileSession && fileSession.trim().length > 0)
        ? fileSession
        : (this.config.sessionString || '');
      if (!sessionString || sessionString.trim().length === 0) {
        throw new Error('Session string is empty. Provide TELEGRAM_SESSION or TELEGRAM_SESSION_STRING');
      }
      const session = new StringSession(sessionString);

      // Создаем клиент
      this.client = new MTProtoClient(session, this.config.apiId, this.config.apiHash, {
        connectionRetries: this.config.retryAttempts || 3,
        timeout: this.config.timeout || 30000,
      });

      // Подключаемся
      await this.client.start({
        phoneNumber: async () => {
          throw new Error('Phone number required for new sessions. Please use session string.');
        },
        password: async () => {
          throw new Error('Password required. Please provide via environment variables.');
        },
        phoneCode: async () => {
          throw new Error('Phone code required. Please provide via environment variables.');
        },
        onError: (err) => {
          console.error('📱 Telegram connection error:', err);
          throw err;
        },
      });

      this.isConnected = true;
      console.log('✅ Connected to Telegram successfully');

      // Сохраняем session string если он новый
      const newSessionString = this.client.session.save() as any as string;
      if (newSessionString && newSessionString !== sessionString) {
        await this.sessionManager.saveSession({
          sessionString: newSessionString,
          userId: await this.getUserId(),
          username: await this.getUsername()
        });
      }

      // Обновляем время последнего использования
      await this.sessionManager.updateLastUsed();

    } catch (error) {
      this.isConnected = false;
      console.error('❌ Failed to connect to Telegram:', error);
      throw error;
    }
  }

  /**
   * Отключение от Telegram API
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        this.isConnected = false;
        console.log('📱 Disconnected from Telegram');
      } catch (error) {
        console.error('⚠️ Error disconnecting from Telegram:', error);
      }
      this.client = null;
    }
  }

  /**
   * Проверка подключения
   */
  async ensureConnected(): Promise<void> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    if (!this.client) {
      throw new Error('Failed to establish Telegram connection');
    }
  }

  /**
   * Получение информации о канале
   */
  async getChannelInfo(channelUsername: string): Promise<TelegramChannelInfo | null> {
    await this.ensureConnected();

    try {
      console.log(`📡 Getting info for channel: ${channelUsername}`);

      // Сначала пробуем стандартный метод
      try {
        const entity = await this.client!.getEntity(channelUsername);

        if (entity && entity.constructor.name === 'Channel') {
          const channel = entity as Api.Channel;
          return {
            id: channel.id.toString(),
            username: channel.username || channelUsername,
            title: channel.title || '',
            membersCount: channel.participantsCount,
            isActive: !channel.left
          };
        }
      } catch (getEntityError) {
        console.log(`⚠️ getEntity failed, trying alternative method...`);

        // Альтернативный метод через resolve
        try {
          const result = await this.client!.invoke(new Api.contacts.ResolveUsername({
            username: channelUsername.replace('@', '')
          }));

          if (result && result.chats && result.chats.length > 0) {
            const chat = result.chats[0] as any;
            console.log(`✅ Channel found via resolve method`);

            return {
              id: chat.id.toString(),
              username: chat.username || channelUsername.replace('@', ''),
              title: chat.title || '',
              membersCount: chat.participantsCount || undefined,
              isActive: !chat.left
            };
          }
        } catch (resolveError) {
          console.log(`⚠️ resolve method also failed`);
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting channel info for ${channelUsername}:`, error);
      return null;
    }
  }

  /**
   * Получение сообщений из канала
   */
  async getChannelMessages(
    channelUsername: string,
    limit: number = this.config.maxMessages,
    offsetId?: number
  ): Promise<TelegramMessage[]> {
    await this.ensureConnected();

    try {
      console.log(`📡 Fetching ${limit} messages from ${channelUsername}${offsetId ? ` starting from ${offsetId}` : ''}`);

      // Rate limiting
      await this.sleep(this.rateLimitDelay);

      let entity: any = null;

      // Сначала пробуем стандартный метод
      try {
        entity = await this.client!.getEntity(channelUsername);
      } catch (getEntityError) {
        console.log(`⚠️ getEntity failed for messages, trying resolve method...`);

        // Альтернативный метод через resolve
        try {
          const result = await this.client!.invoke(new Api.contacts.ResolveUsername({
            username: channelUsername.replace('@', '')
          }));

          if (result && result.chats && result.chats.length > 0) {
            entity = result.chats[0];
            console.log(`✅ Channel entity found via resolve for messages`);
          }
        } catch (resolveError) {
          console.log(`⚠️ resolve method also failed for messages`);
          throw new Error(`Cannot access channel ${channelUsername}: both getEntity and resolve failed`);
        }
      }

      if (!entity) {
        throw new Error(`No entity found for channel ${channelUsername}`);
      }

      const messages = await this.client!.getMessages(entity, {
        limit,
        offsetId
      });

      const telegramMessages: TelegramMessage[] = messages
        .filter(msg => msg && msg.message) // Фильтруем пустые сообщения
        .map(msg => ({
          id: msg.id,
          text: msg.message,
          date: new Date(msg.date * 1000), // Telegram возвращает timestamp в секундах
          channelId: entity.id?.toString() || '',
          channelUsername: channelUsername,
          from: msg.fromId ? {
            id: this.extractIdFromPeer(msg.fromId),
            username: undefined, // Получим отдельно если нужно
            firstName: undefined
          } : undefined
        }));

      console.log(`✅ Retrieved ${telegramMessages.length} messages from ${channelUsername}`);
      return telegramMessages;

    } catch (error) {
      console.error(`❌ Error fetching messages from ${channelUsername}:`, error);
      throw error;
    }
  }

  /**
   * Получение новых сообщений с определенной позиции
   */
  async getNewMessages(
    channelUsername: string,
    lastMessageId: number,
    limit: number = this.config.maxMessages
  ): Promise<TelegramMessage[]> {
    const messages = await this.getChannelMessages(channelUsername, limit);
    return messages.filter(msg => msg.id > lastMessageId);
  }

  /**
   * Получение ID текущего пользователя
   */
  private async getUserId(): Promise<number> {
    if (!this.client) return 0;

    try {
      const me = await this.client.getMe();
      return me.id?.valueOf() || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Получение username текущего пользователя
   */
  private async getUsername(): Promise<string | undefined> {
    if (!this.client) return undefined;

    try {
      const me = await this.client.getMe();
      return me.username;
    } catch {
      return undefined;
    }
  }

  /**
   * Утилита для задержки (rate limiting)
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Извлечение ID из peer объекта
   */
  private extractIdFromPeer(peer: any): number {
    if (!peer) return 0;

    // Проверяем разные типы peer
    if (peer.userId) return peer.userId;
    if (peer.channelId) return peer.channelId;
    if (peer.chatId) return peer.chatId;

    // Fallback для других типов
    return peer.id || 0;
  }

  /**
   * Проверка доступности канала
   */
  async isChannelAccessible(channelUsername: string): Promise<boolean> {
    try {
      const info = await this.getChannelInfo(channelUsername);
      if (info) return true;

      // Если getChannelInfo не сработал, пробуем напрямую получить сообщения
      console.log(`🔄 Trying alternative accessibility check for ${channelUsername}...`);
      const messages = await this.getChannelMessages(channelUsername, 1);
      return messages.length >= 0; // Даже 0 сообщений означает что канал доступен
    } catch (error) {
      console.log(`❌ Channel ${channelUsername} is completely inaccessible:`, error instanceof Error ? error.message : error);
      return false;
    }
  }

  /**
   * Получение статуса подключения
   */
  getConnectionStatus(): {
    connected: boolean;
    sessionValid: boolean;
  } {
    return {
      connected: this.isConnected,
      sessionValid: !!this.client
    };
  }

  /**
   * Установка задержки для rate limiting
   */
  setRateLimit(delayMs: number): void {
    this.rateLimitDelay = Math.max(delayMs, 1000); // Минимум 1 секунда
    console.log(`⏱️ Rate limit set to ${this.rateLimitDelay}ms`);
  }

  /**
 * Отправка сообщения в канал
 */
  async sendMessageToChannel(channelUsername: string, message: string, options?: any): Promise<any> {
    await this.ensureConnected();

    try {
      console.log(`📤 Sending message to channel: ${channelUsername}`);

      const entity = await this.client!.getEntity(channelUsername);
      const result = await this.client!.sendMessage(entity, {
        message,
        ...options
      });

      console.log(`✅ Message sent successfully to ${channelUsername}`);
      return result;
    } catch (error) {
      console.error(`❌ Error sending message to ${channelUsername}:`, error);
      throw error;
    }
  }
} 