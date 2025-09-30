import type { TelegramMessage, TelegramParsingResult } from '@jspulse/shared';
import type { IVacancyRepository } from '@jspulse/shared';
import { TelegramClient } from './telegram/TelegramClient.js';
import { MessageProcessor } from './telegram/MessageProcessor.js';
import { TELEGRAM_CONFIG } from '../config/telegram.js';
import * as cheerio from 'cheerio';
import ky from 'ky';

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

  private makePreview(text: string, limit = 500): string {
    const norm = (text || '').replace(/\s+/g, ' ').trim();
    if (norm.length <= limit) return norm;
    const slice = norm.slice(0, limit);
    const last = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
    return (last > 100 ? slice.slice(0, last + 1) : slice) + '…';
  }

  private extractFirstParagraph(htmlOrText: string): string {
    if (!htmlOrText) return '';

    // Если это HTML, извлекаем первый параграф
    if (htmlOrText.includes('<')) {
      try {
        const $ = require('cheerio').load(htmlOrText);
        const firstP = $('p').first();
        if (firstP.length > 0) {
          const text = firstP.text().trim();
          if (text) return text;
        }
      } catch (e) {
        console.warn('Failed to parse HTML for first paragraph:', e);
      }
    }

    // Fallback: берем первые 2-3 предложения из текста
    const sentences = htmlOrText.replace(/<[^>]*>/g, '').split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 0) {
      const firstSentence = sentences[0].trim();
      if (firstSentence.length > 20) {
        return firstSentence + (sentences[0].includes('.') ? '' : '.');
      }
      // Если первое предложение короткое, берем первые два
      if (sentences.length > 1) {
        return (firstSentence + ' ' + sentences[1]).trim() + '.';
      }
    }

    // Последний fallback: обрезаем до 200 символов
    return this.makePreview(htmlOrText.replace(/<[^>]*>/g, ''), 200);
  }

  private extractTelegraphUrl(text?: string): string | undefined {
    if (!text) return undefined;
    const m = text.match(/https?:\/\/(?:te\.legra\.ph|telegra\.ph|telegraph\.ph)\/[\w\-\/]+/i);
    return m ? m[0] : undefined;
  }

  private async fetchTelegraphHtml(url?: string): Promise<{ raw: string; text: string } | undefined> {
    if (!url) return undefined;
    try {
      const html = await ky.get(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'JS-Pulse/1.0 (+https://jspulse.ru) NodeFetch',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru,en;q=0.8'
        }
      }).text();
      const $ = cheerio.load(html);

      // Telegraph использует #_tl_editor как основной контейнер
      let content = $('#_tl_editor').first();
      if (content.length === 0) {
        content = $('.tl_article_content').first();
      }
      if (content.length === 0) {
        content = $('article').first();
      }

      if (content.length === 0) {
        console.warn(`No content found in telegraph ${url}`);
        return undefined;
      }

      // Клонируем контент и удаляем первый h1 (дублированный заголовок)
      const contentClone = content.clone();
      contentClone.find('h1').first().remove();

      // Убираем пустые элементы и заменяем пустые параграфы с <br> на один <br>
      contentClone.find('address').remove();
      contentClone.find('p').each((_, el) => {
        const $el = $(el);
        if ($el.text().trim() === '') {
          if ($el.html() === '<br>' || $el.html() === '<br></br>') {
            // Заменяем пустой параграф с <br> на один <br>
            $el.replaceWith('<br>');
          } else {
            // Удаляем полностью пустые параграфы
            $el.remove();
          }
        }
      });

      const raw = contentClone.html() || '';
      const text = contentClone.text() || '';

      const normText = (text || '').replace(/\s+/g, ' ').trim();
      return { raw, text: normText };
    } catch (error) {
      console.warn(`Failed to fetch telegraph ${url}:`, error instanceof Error ? error.message : error);
      return undefined;
    }
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

    // Ищем ссылку на Telegraph в описании из Telegram
    const telegramText = data.description || (result.message as any)?.text || '';
    const telegraphUrl = this.extractTelegraphUrl(telegramText);

    // Подтягиваем полное описание с Telegraph (если есть ссылка)
    let telegraphData = null;
    if (telegraphUrl) {
      console.log(`🔗 Fetching Telegraph content from: ${telegraphUrl}`);
      telegraphData = await this.fetchTelegraphHtml(telegraphUrl);
    }

    // Формируем описание: приоритет Telegraph, иначе Telegram
    const fullText = telegraphData?.text || telegramText;
    const rawHtml = telegraphData?.raw;

    // Извлекаем первый параграф как краткое описание
    const preview = this.extractFirstParagraph(rawHtml || fullText);

    // Формируем данные
    const vacancyData: any = {
      externalId: sourceId,
      title: data.title || 'Unknown Position',
      company: data.company || 'Unknown Company',
      location: data.location || '—',
      url: telegraphUrl || `https://t.me/${channelUsername.replace('@', '')}/${result.message.id}`,
      publishedAt: result.message.date || new Date(),
      source: 'telegram' as const,
      description: preview,
      fullDescription: rawHtml ? { raw: rawHtml, preview, processed: rawHtml, textOnly: fullText } : undefined,
      skills: data.skills || [],
      salaryFrom: data.salary?.from,
      salaryTo: data.salary?.to,
      salaryCurrency: data.salary?.currency || 'RUB',
      contact: data.contact,
      workFormat: (data as any).format,
      employment: (data as any).employment,
      sourceId,
      sourceChannel: channelUsername,
      sourceUrl: telegraphUrl,
      parsedAt: new Date(),
      hashtags: (data as any).hashtags || [],
      confidence: data.confidence
    };

    try {
      const savedVacancy = await this.vacancyRepository.create(vacancyData);
      console.log(`✅ Saved vacancy: ${savedVacancy.title} at ${savedVacancy.company}${telegraphUrl ? ' (with Telegraph content)' : ''}`);
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