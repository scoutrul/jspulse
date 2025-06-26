import type { TelegramMessage, TelegramParsingResult } from '@jspulse/shared';
import type { IVacancyRepository } from '@jspulse/shared';
import { TelegramClient } from './telegram/TelegramClient.js';
import { MessageProcessor } from './telegram/MessageProcessor.js';
import { TELEGRAM_CONFIG } from '../config/telegram.js';

/**
 * Сервис для парсинга Telegram каналов и сохранения вакансий в базу данных
 */
export class TelegramParserService {
  private telegramClient: TelegramClient;
  private messageProcessor: MessageProcessor;
  private vacancyRepository: IVacancyRepository;

  constructor(vacancyRepository: IVacancyRepository) {
    this.telegramClient = new TelegramClient();
    this.messageProcessor = new MessageProcessor();
    this.vacancyRepository = vacancyRepository;
  }

  /**
   * Основной метод парсинга всех каналов
   */
  async parseAllChannels(): Promise<{
    totalProcessed: number;
    totalSaved: number;
    channels: Array<{
      channel: string;
      processed: number;
      saved: number;
      errors: string[];
    }>;
  }> {
    console.log('🚀 Starting Telegram parsing for all channels...');

    if (!TELEGRAM_CONFIG.PARSER_ENABLED) {
      console.log('⚠️ Telegram parser is disabled in configuration');
      return { totalProcessed: 0, totalSaved: 0, channels: [] };
    }

    const results = {
      totalProcessed: 0,
      totalSaved: 0,
      channels: [] as Array<{
        channel: string;
        processed: number;
        saved: number;
        errors: string[];
      }>
    };

    try {
      // Подключаемся к Telegram
      await this.telegramClient.connect();
      console.log('✅ Connected to Telegram');

      // Обрабатываем каждый канал
      for (const channelUsername of TELEGRAM_CONFIG.CHANNELS) {
        console.log(`\n📡 Processing channel: ${channelUsername}`);

        const channelResult = {
          channel: channelUsername,
          processed: 0,
          saved: 0,
          errors: [] as string[]
        };

        try {
          // Проверяем доступность канала
          const isAccessible = await this.telegramClient.isChannelAccessible(channelUsername);
          if (!isAccessible) {
            channelResult.errors.push('Channel is not accessible');
            results.channels.push(channelResult);
            continue;
          }

          // Получаем сообщения
          const messages = await this.telegramClient.getChannelMessages(
            channelUsername,
            TELEGRAM_CONFIG.MAX_MESSAGES
          );

          console.log(`📬 Retrieved ${messages.length} messages from ${channelUsername}`);

          if (messages.length === 0) {
            channelResult.errors.push('No messages found');
            results.channels.push(channelResult);
            continue;
          }

          // Обрабатываем сообщения
          const parsingResults = await this.messageProcessor.processMessages(messages);
          const validResults = parsingResults.filter(r => r.valid);

          channelResult.processed = parsingResults.length;
          results.totalProcessed += parsingResults.length;

          console.log(`✅ Processed ${parsingResults.length} messages, ${validResults.length} valid vacancies`);

          // Сохраняем валидные вакансии в базу данных
          let savedCount = 0;
          for (const result of validResults) {
            try {
              const saved = await this.saveVacancy(result, channelUsername);
              if (saved) savedCount++;
            } catch (saveError) {
              const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown save error';
              channelResult.errors.push(`Save error: ${errorMessage}`);
              console.error(`❌ Error saving vacancy from message ${result.message.id}:`, saveError);
            }
          }

          channelResult.saved = savedCount;
          results.totalSaved += savedCount;

          console.log(`💾 Saved ${savedCount} new vacancies from ${channelUsername}`);

        } catch (channelError) {
          const errorMessage = channelError instanceof Error ? channelError.message : 'Unknown channel error';
          channelResult.errors.push(errorMessage);
          console.error(`❌ Error processing channel ${channelUsername}:`, channelError);
        }

        results.channels.push(channelResult);
      }

      await this.telegramClient.disconnect();
      console.log('📱 Disconnected from Telegram');

      console.log('\n📊 PARSING SUMMARY:');
      console.log(`📝 Total messages processed: ${results.totalProcessed}`);
      console.log(`💾 Total vacancies saved: ${results.totalSaved}`);
      console.log(`📈 Success rate: ${results.totalProcessed > 0 ? (results.totalSaved / results.totalProcessed * 100).toFixed(1) : 0}%`);

      return results;

    } catch (error) {
      console.error('❌ Critical error in Telegram parsing:', error);
      await this.telegramClient.disconnect();
      throw error;
    }
  }

  /**
   * Сохранение одной вакансии в базу данных
   */
  private async saveVacancy(
    result: TelegramParsingResult,
    channelUsername: string
  ): Promise<boolean> {
    const data = result.extractedData;

    // Создаем уникальный sourceId для предотвращения дубликатов
    const sourceId = `telegram_${channelUsername}_${result.message.id}`;

    // Проверяем, существует ли уже вакансия с таким sourceId
    const existingVacancy = await this.vacancyRepository.findBySourceId(sourceId);
    if (existingVacancy) {
      console.log(`⚠️ Vacancy from message ${result.message.id} already exists, skipping`);
      return false;
    }

    // Подготавливаем данные для сохранения
    const vacancyData = {
      // Обязательные поля для MongoDB
      externalId: sourceId, // Используем sourceId как externalId
      title: data.title || 'Unknown Position',
      company: data.company || 'Unknown Company',
      location: data.location || 'Remote',
      url: (data as any).descriptionUrl || `https://t.me/${channelUsername.replace('@', '')}/${result.message.id}`,
      publishedAt: result.message.date || new Date(),
      source: 'telegram' as const,

      // Дополнительные поля
      description: data.description,
      fullDescription: (data as any).fullDescription,
      skills: data.skills || [],
      salaryFrom: data.salary?.from,
      salaryTo: data.salary?.to,
      salaryCurrency: data.salary?.currency || 'RUB',
      contact: data.contact,
      workFormat: (data as any).format,
      employment: (data as any).employment,

      // Telegram-специфичные поля
      sourceId,
      sourceChannel: channelUsername,
      sourceUrl: (data as any).descriptionUrl,
      parsedAt: new Date(),
      hashtags: (data as any).hashtags || [],
      confidence: data.confidence
    };

    try {
      const savedVacancy = await this.vacancyRepository.create(vacancyData);
      console.log(`✅ Saved vacancy: ${savedVacancy.title} at ${savedVacancy.company}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving vacancy:', error);
      return false;
    }
  }

  /**
   * Парсинг конкретного канала (для тестирования или отдельного запуска)
   */
  async parseChannel(channelUsername: string): Promise<{
    processed: number;
    saved: number;
    errors: string[];
  }> {
    console.log(`🔍 Parsing single channel: ${channelUsername}`);

    const result = await this.parseAllChannels();
    const channelResult = result.channels.find(c => c.channel === channelUsername);

    return channelResult || { processed: 0, saved: 0, errors: ['Channel not found in results'] };
  }

  /**
   * Получение статистики парсинга
   */
  async getParsingStats(): Promise<{
    totalVacancies: number;
    telegramVacancies: number;
    channelBreakdown: Array<{ channel: string; count: number; latest: Date | null }>;
  }> {
    const totalVacancies = await this.vacancyRepository.count();
    const telegramVacancies = await this.vacancyRepository.count({ source: 'telegram' });

    // Статистика по каналам
    const channelBreakdown = [];
    for (const channel of TELEGRAM_CONFIG.CHANNELS) {
      const count = await this.vacancyRepository.count({ sourceChannel: channel });
      // Упрощенная версия - без поиска последней вакансии
      channelBreakdown.push({
        channel,
        count,
        latest: null // TODO: добавить метод для поиска последней записи по дате
      });
    }

    return {
      totalVacancies,
      telegramVacancies,
      channelBreakdown
    };
  }
} 