import type { TelegramMessage, TelegramParsingResult, TelegramConfig } from '@jspulse/shared';
import { TELEGRAM_CONFIG } from '../../config/telegram.js';

/**
 * Процессор для обработки Telegram сообщений и извлечения данных о вакансиях
 */
export class MessageProcessor {
  private config: TelegramConfig;

  constructor(config?: TelegramConfig) {
    this.config = config || this.createConfigFromTelegram();
  }

  /**
   * Создание конфигурации из TELEGRAM_CONFIG
   */
  private createConfigFromTelegram(): TelegramConfig {
    return {
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
    };
  }

  /**
   * Основной метод обработки сообщения
   */
  async processMessage(message: TelegramMessage): Promise<TelegramParsingResult> {
    console.log(`🔍 Processing message ${message.id} from ${message.channelUsername}`);

    const text = message.text.toLowerCase();
    const originalText = message.text;

    // 1. Первичная валидация
    const isValidVacancy = this.validateMessage(text);

    if (!isValidVacancy.valid) {
      return {
        message,
        extractedData: {
          description: originalText,
          confidence: 0
        },
        valid: false,
        errors: isValidVacancy.errors
      };
    }

    // 2. Извлечение данных
    const extractedData = {
      title: this.extractTitle(originalText),
      company: this.extractCompany(originalText),
      location: this.extractLocation(originalText),
      salary: this.extractSalary(originalText),
      skills: this.extractSkills(originalText),
      description: originalText,
      contact: this.extractContact(originalText),
      confidence: this.calculateConfidence(originalText)
    };

    console.log(`✅ Extracted data with confidence: ${extractedData.confidence}`);

    return {
      message,
      extractedData,
      valid: extractedData.confidence > 0.3, // Минимальный порог уверенности
      errors: extractedData.confidence < 0.3 ? ['Low confidence in data extraction'] : undefined
    };
  }

  /**
   * Валидация сообщения по ключевым словам
   */
  private validateMessage(text: string): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Проверяем наличие обязательных ключевых слов
    const hasRequiredKeywords = this.config.keyWords.some(keyword =>
      text.includes(keyword.toLowerCase())
    );

    if (!hasRequiredKeywords) {
      errors.push(`No required keywords found. Required: ${this.config.keyWords.join(', ')}`);
    }

    // Проверяем исключающие слова
    const excludedWords = TELEGRAM_CONFIG.KEYWORDS.EXCLUDED;
    const hasExcludedWords = excludedWords.some(word =>
      text.includes(word.toLowerCase())
    );

    if (hasExcludedWords) {
      errors.push('Contains excluded keywords (spam/advertisement)');
    }

    // Проверяем минимальную длину
    if (text.length < 50) {
      errors.push('Message too short to be a valid vacancy');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Извлечение заголовка вакансии
   */
  private extractTitle(text: string): string | undefined {
    // Ищем строки, которые выглядят как заголовки вакансий
    const titlePatterns = [
      /(?:вакансия|позиция|vacancy|position)\s*:?\s*([^\n]+)/gi,
      /(?:^|\n)([A-Za-zА-Яё\s]+(?:developer|разработчик|программист|developer|engineer)[^\n]*)/gi,
      /(?:ищем|looking for|требуется)\s+([^\n]+)/gi
    ];

    for (const pattern of titlePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const title = match[1]?.trim();
        if (title && title.length > 10 && title.length < 100) {
          return this.cleanText(title);
        }
      }
    }

    // Fallback: берем первую строку если она выглядит как заголовок
    const firstLine = text.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
      return this.cleanText(firstLine);
    }

    return undefined;
  }

  /**
   * Извлечение информации о компании
   */
  private extractCompany(text: string): string | undefined {
    for (const pattern of this.config.companyPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const company = match[1]?.trim();
        if (company && company.length > 2 && company.length < 100) {
          return this.cleanText(company);
        }
      }
    }

    // Дополнительные паттерны
    const additionalPatterns = [
      /(?:^|\n)([A-Za-zА-Яё\s]+(?:LLC|ООО|Inc|Ltd|ЗАО|ОАО)[^\n]*)/gi,
      /в\s+компанию\s+([^\n]+)/gi
    ];

    for (const pattern of additionalPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const company = match[1]?.trim();
        if (company && company.length > 2 && company.length < 100) {
          return this.cleanText(company);
        }
      }
    }

    return undefined;
  }

  /**
   * Извлечение локации
   */
  private extractLocation(text: string): string | undefined {
    for (const pattern of this.config.locationPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const location = match[1]?.trim();
        if (location && location.length > 2 && location.length < 50) {
          return this.cleanText(location);
        }
      }
    }

    // Дополнительные паттерны для локации
    const locationPatterns = [
      /(?:в|из)\s+(москв[а-я]*|спб|петербург[а-я]*|екатеринбург[а-я]*|новосибирск[а-я]*|краснодар[а-я]*)/gi,
      /(?:remote|удален[а-я]*|дистанц[а-я]*)/gi
    ];

    for (const pattern of locationPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const location = match[1] || match[0];
        if (location) {
          return this.cleanText(location);
        }
      }
    }

    return undefined;
  }

  /**
   * Извлечение зарплаты
   */
  private extractSalary(text: string): { from?: number; to?: number; currency?: string } | undefined {
    for (const pattern of this.config.salaryPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const salaryText = match[1]?.trim();
        if (salaryText) {
          return this.parseSalary(salaryText, text);
        }
      }
    }

    // Дополнительные паттерны
    const additionalPatterns = [
      /(\d+(?:\s*\d+)*)\s*-\s*(\d+(?:\s*\d+)*)\s*(?:тыс|k|т\.р|₽|руб|usd|\$)/gi,
      /от\s*(\d+(?:\s*\d+)*)\s*(?:тыс|k|т\.р|₽|руб|usd|\$)/gi,
      /до\s*(\d+(?:\s*\d+)*)\s*(?:тыс|k|т\.р|₽|руб|usd|\$)/gi
    ];

    for (const pattern of additionalPatterns) {
      const match = pattern.exec(text);
      if (match) {
        return this.parseSalaryFromMatch(match, text);
      }
    }

    return undefined;
  }

  /**
   * Парсинг зарплаты из текста
   */
  private parseSalary(salaryText: string, fullText: string): { from?: number; to?: number; currency?: string } | undefined {
    // Определяем валюту
    const currency = this.detectCurrency(fullText);

    // Убираем пробелы и извлекаем числа
    const cleanSalary = salaryText.replace(/\s+/g, '');

    // Паттерн для диапазона (100-200, 100к-200к)
    const rangeMatch = cleanSalary.match(/(\d+)(?:к|k)?-(\d+)(?:к|k)?/i);
    if (rangeMatch) {
      const from = this.normalizeAmount(parseInt(rangeMatch[1]), fullText);
      const to = this.normalizeAmount(parseInt(rangeMatch[2]), fullText);
      return { from, to, currency };
    }

    // Паттерн для одного числа
    const singleMatch = cleanSalary.match(/(\d+)(?:к|k)?/i);
    if (singleMatch) {
      const amount = this.normalizeAmount(parseInt(singleMatch[1]), fullText);
      return { from: amount, currency };
    }

    return undefined;
  }

  /**
   * Парсинг зарплаты из regex match
   */
  private parseSalaryFromMatch(match: RegExpExecArray, fullText: string): { from?: number; to?: number; currency?: string } | undefined {
    const currency = this.detectCurrency(fullText);

    if (match[2]) {
      // Диапазон
      const from = this.normalizeAmount(parseInt(match[1].replace(/\s+/g, '')), fullText);
      const to = this.normalizeAmount(parseInt(match[2].replace(/\s+/g, '')), fullText);
      return { from, to, currency };
    } else {
      // Одно значение
      const amount = this.normalizeAmount(parseInt(match[1].replace(/\s+/g, '')), fullText);
      return { from: amount, currency };
    }
  }

  /**
   * Определение валюты
   */
  private detectCurrency(text: string): string {
    if (/\$|usd|долл/gi.test(text)) return 'USD';
    if (/€|eur|евро/gi.test(text)) return 'EUR';
    return 'RUB'; // По умолчанию рубли
  }

  /**
   * Нормализация суммы (добавление тысяч где нужно)
   */
  private normalizeAmount(amount: number, fullText: string): number {
    // Если в тексте есть "тыс", "к", "k" и число меньше 1000, умножаем на 1000
    if (/тыс|к|k/gi.test(fullText) && amount < 1000) {
      return amount * 1000;
    }
    return amount;
  }

  /**
   * Извлечение навыков
   */
  private extractSkills(text: string): string[] {
    const skills: Set<string> = new Set();

    // Используем паттерны из конфигурации
    for (const pattern of this.config.skillsPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const skillsText = match[1]?.trim();
        if (skillsText) {
          this.parseSkillsFromText(skillsText).forEach(skill => skills.add(skill));
        }
      }
    }

    // Дополнительный поиск популярных технологий
    const techKeywords = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'python', 'java',
      'php', 'c#', 'c++', 'go', 'rust', 'swift', 'kotlin', 'docker', 'kubernetes',
      'aws', 'azure', 'git', 'sql', 'mongodb', 'postgresql', 'redis', 'html', 'css'
    ];

    const textLower = text.toLowerCase();
    techKeywords.forEach(tech => {
      if (textLower.includes(tech)) {
        skills.add(tech);
      }
    });

    return Array.from(skills).slice(0, 10); // Ограничиваем количество навыков
  }

  /**
   * Парсинг навыков из текста
   */
  private parseSkillsFromText(skillsText: string): string[] {
    // Разделяем по запятым, точкам с запятой, переносам строк
    return skillsText
      .split(/[,;|\n]+/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 1 && skill.length < 30)
      .map(skill => this.cleanText(skill));
  }

  /**
   * Извлечение контактной информации
   */
  private extractContact(text: string): string | undefined {
    const contactPatterns = [
      /@[a-zA-Z0-9_]+/g, // Telegram username
      /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // Phone
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g // Email
    ];

    const contacts: string[] = [];

    for (const pattern of contactPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        contacts.push(...matches);
      }
    }

    return contacts.length > 0 ? contacts.join(', ') : undefined;
  }

  /**
   * Расчет уверенности в корректности парсинга
   */
  private calculateConfidence(text: string): number {
    let confidence = 0;

    // Базовая уверенность за наличие ключевых слов
    const hasKeywords = this.config.keyWords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasKeywords) confidence += 0.3;

    // Бонус за структурированность
    if (text.includes(':') || text.includes('•') || text.includes('-')) {
      confidence += 0.2;
    }

    // Бонус за наличие зарплаты
    if (this.extractSalary(text)) {
      confidence += 0.2;
    }

    // Бонус за наличие навыков
    const skills = this.extractSkills(text);
    if (skills.length > 0) {
      confidence += Math.min(0.2, skills.length * 0.05);
    }

    // Бонус за наличие контактов
    if (this.extractContact(text)) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Очистка текста от лишних символов
   */
  private cleanText(text: string): string {
    return text
      .replace(/[«»""\(\)\[\]]/g, '') // Убираем кавычки и скобки
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .trim();
  }

  /**
   * Пакетная обработка сообщений
   */
  async processMessages(messages: TelegramMessage[]): Promise<TelegramParsingResult[]> {
    console.log(`🔄 Processing ${messages.length} messages...`);

    const results: TelegramParsingResult[] = [];

    for (const message of messages) {
      try {
        const result = await this.processMessage(message);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error processing message ${message.id}:`, error);
        results.push({
          message,
          extractedData: {
            description: message.text,
            confidence: 0
          },
          valid: false,
          errors: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    }

    const validResults = results.filter(r => r.valid);
    console.log(`✅ Processed ${results.length} messages, ${validResults.length} valid vacancies found`);

    return results;
  }
} 