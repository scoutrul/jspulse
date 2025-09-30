import type { TelegramMessage, TelegramParsingResult, TelegramConfig } from '@jspulse/shared';
import { TELEGRAM_CONFIG } from '../../config/telegram.js';
import { normalizeSkill } from '../../utils/transformations.js';
import { containsBackendStopWords, findBackendStopWords } from '../../config/backendStopWords.js';

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
      title: this.extractTitleV2(originalText),
      company: this.extractCompanyV2(originalText),
      location: this.extractLocationV2(originalText),
      salary: this.extractSalaryV2(originalText),
      skills: this.extractSkillsV2(originalText),
      description: originalText,
      contact: this.extractContactV2(originalText),
      format: this.extractFormat(originalText),
      employment: this.extractEmployment(originalText),
      descriptionUrl: this.extractDescriptionUrl(originalText),
      hashtags: this.extractHashtags(originalText),
      fullDescription: await this.extractFullDescription(originalText),
      confidence: this.calculateConfidenceV2(originalText)
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
    const hasRequiredKeywords = this.config.keyWords.some((keyword: string) =>
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

    // Проверяем стоп-слова для технологий бэкенда (кроме Node.js)
    if (containsBackendStopWords(text)) {
      const foundStopWords = findBackendStopWords(text);
      errors.push(`Contains backend technology stop words: ${foundStopWords.join(', ')}`);
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
        skills.add(normalizeSkill(tech));
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
      .map(skill => normalizeSkill(skill.trim()))
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
    const hasKeywords = this.config.keyWords.some((keyword: string) =>
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

  // ============================================================================
  // НОВЫЕ МЕТОДЫ ДЛЯ @vacancy_it_ulbitv ФОРМАТА
  // ============================================================================

  /**
   * Извлечение заголовка из **жирного** текста в начале сообщения
   */
  private extractTitleV2(text: string): string | undefined {
    const titleMatch = text.match(TELEGRAM_CONFIG.PARSING.TITLE_REGEX);
    if (titleMatch && titleMatch[1]) {
      return this.cleanText(titleMatch[1]);
    }

    // Fallback к старому методу
    return this.extractTitle(text);
  }

  /**
   * Извлечение компании из **Компания:** поля
   */
  private extractCompanyV2(text: string): string | undefined {
    const companyMatch = text.match(TELEGRAM_CONFIG.PARSING.COMPANY_REGEX);
    if (companyMatch && companyMatch[1]) {
      return this.cleanText(companyMatch[1]);
    }

    // Fallback к старому методу
    return this.extractCompany(text);
  }

  /**
   * Извлечение зарплаты из **ЗП:** поля или других мест
   */
  private extractSalaryV2(text: string): { from?: number; to?: number; currency?: string } | undefined {
    const salaryMatches = text.matchAll(TELEGRAM_CONFIG.PARSING.SALARY_REGEX);

    for (const match of salaryMatches) {
      const salaryText = match[1] || match[2];
      if (salaryText) {
        const parsed = this.parseSalary(salaryText, text);
        if (parsed) return parsed;
      }
    }

    // Fallback к старому методу
    return this.extractSalary(text);
  }

  /**
   * Извлечение локации из **Формат:** поля и других мест
   */
  private extractLocationV2(text: string): string | undefined {
    // Сначала пробуем из формата работы
    const formatMatch = text.match(TELEGRAM_CONFIG.PARSING.FORMAT_REGEX);
    if (formatMatch && formatMatch[1]) {
      const format = formatMatch[1];
      // Извлекаем города из скобок
      const locationInBrackets = format.match(/\(([^)]+)\)/);
      if (locationInBrackets) {
        return this.cleanText(locationInBrackets[1]);
      }
      return this.cleanText(format);
    }

    // Затем ищем общие паттерны локации
    const locationMatches = text.matchAll(TELEGRAM_CONFIG.PARSING.LOCATION_REGEX);
    for (const match of locationMatches) {
      if (match[0]) {
        return this.cleanText(match[0]);
      }
    }

    // Fallback к старому методу
    return this.extractLocation(text);
  }

  /**
   * Извлечение навыков из хештегов и текста
   */
  private extractSkillsV2(text: string): string[] {
    const skills: Set<string> = new Set();

    // Извлекаем из хештегов
    const hashtagMatches = text.matchAll(TELEGRAM_CONFIG.PARSING.SKILLS_REGEX);
    for (const match of hashtagMatches) {
      if (match[1]) {
        skills.add(match[1].toLowerCase());
      }
    }

    // Добавляем навыки из общих хештегов
    const allHashtags = this.extractHashtags(text);
    allHashtags.forEach(tag => {
      // Проверяем известные технологии
      const techPattern = /^(react|vue|angular|javascript|typescript|nodejs?|nestjs|express|frontend|backend|fullstack|python|java|php|csharp|dotnet|docker|kubernetes|aws|azure|sql|mongodb|postgresql|redis|html|css|sass|scss|webpack|vite|git|nextjs|next\.js|nuxt|nuxtjs|nuxt\.js|svelte|sveltekit|rxjs|redux|redux[-\s]?toolkit|vuex|pinia|babel|prettier|jest|vitest|testing[-\s]?library|cypress|playwright|storybook|tailwind|tailwindcss|styled[-\s]?components|emotion|graphql|apollo|three\.js|threejs|d3|chart\.js|chartjs|webgl|pwa|service[-\s]?worker)$/i;
      if (techPattern.test(tag)) {
        skills.add(normalizeSkill(tag));
      }
    });

    // Fallback к старому методу если мало навыков
    if (skills.size < 2) {
      const oldSkills = this.extractSkills(text);
      oldSkills.forEach(skill => skills.add(skill));
    }

    return Array.from(skills).slice(0, 15);
  }

  /**
   * Извлечение контакта HR
   */
  private extractContactV2(text: string): string | undefined {
    const hrMatch = text.match(TELEGRAM_CONFIG.PARSING.HR_CONTACT_REGEX);
    if (hrMatch && hrMatch[1]) {
      return hrMatch[1];
    }

    // Fallback к старому методу
    return this.extractContact(text);
  }

  /**
   * Извлечение формата работы
   */
  private extractFormat(text: string): string | undefined {
    const formatMatch = text.match(TELEGRAM_CONFIG.PARSING.FORMAT_REGEX);
    if (formatMatch && formatMatch[1]) {
      return this.cleanText(formatMatch[1]);
    }
    return undefined;
  }

  /**
   * Извлечение типа занятости
   */
  private extractEmployment(text: string): string | undefined {
    const employmentMatch = text.match(TELEGRAM_CONFIG.PARSING.EMPLOYMENT_REGEX);
    if (employmentMatch && employmentMatch[1]) {
      return this.cleanText(employmentMatch[1]);
    }
    return undefined;
  }

  /**
   * Извлечение ссылки на описание
   */
  private extractDescriptionUrl(text: string): string | undefined {
    const urlMatch = text.match(TELEGRAM_CONFIG.PARSING.DESCRIPTION_REGEX);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    return undefined;
  }

  /**
   * Извлечение хештегов
   */
  private extractHashtags(text: string): string[] {
    const hashtags: string[] = [];
    const hashtagMatches = text.matchAll(TELEGRAM_CONFIG.PARSING.HASHTAGS_REGEX);
    for (const match of hashtagMatches) {
      if (match[1]) {
        hashtags.push(match[1].toLowerCase());
      }
    }
    return hashtags;
  }

  /**
   * Извлечение полного описания из Telegraph ссылки
   */
  private async extractFullDescription(text: string): Promise<string | undefined> {
    const descriptionUrl = this.extractDescriptionUrl(text);
    if (!descriptionUrl || !descriptionUrl.includes('telegra.ph')) {
      return undefined;
    }

    try {
      console.log(`🔗 Fetching full description from: ${descriptionUrl}`);

      // Простой HTTP запрос к Telegraph
      const response = await fetch(descriptionUrl);
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch description: ${response.status}`);
        return undefined;
      }

      const html = await response.text();

      // Простое извлечение текста из HTML (удаляем теги)
      const textContent = html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Извлекаем основной контент (после заголовка, до конца)
      const contentMatch = textContent.match(/Компания:.*$/s);
      if (contentMatch) {
        const fullDescription = contentMatch[0].substring(0, 2000); // Ограничиваем длину
        console.log(`✅ Successfully extracted ${fullDescription.length} characters of full description`);
        return fullDescription;
      }

      return textContent.substring(0, 2000); // Fallback

    } catch (error) {
      console.warn(`⚠️ Error fetching full description from ${descriptionUrl}:`, error);
      return undefined;
    }
  }

  /**
   * Улучшенный расчет уверенности для @vacancy_it_ulbitv формата
   */
  private calculateConfidenceV2(text: string): number {
    let confidence = 0;

    // Базовая уверенность за наличие ключевых слов (0.2)
    const hasKeywords = TELEGRAM_CONFIG.KEYWORDS.REQUIRED.some((keyword: string) =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasKeywords) confidence += 0.2;

    // Бонус за структуру @vacancy_it_ulbitv (0.4)
    let structureScore = 0;
    if (text.includes('**Компания:**')) structureScore += 0.1;
    if (text.includes('**ЗП:**')) structureScore += 0.1;
    if (text.includes('**Формат:**')) structureScore += 0.1;
    if (text.includes('**Занятость:**')) structureScore += 0.1;
    confidence += structureScore;

    // Бонус за заголовок в **жирном** тексте (0.15)
    if (TELEGRAM_CONFIG.PARSING.TITLE_REGEX.test(text)) {
      confidence += 0.15;
    }

    // Бонус за хештеги (0.1)
    const hashtags = this.extractHashtags(text);
    if (hashtags.length >= 3) {
      confidence += 0.1;
    }

    // Бонус за ссылку на описание (0.1)
    if (this.extractDescriptionUrl(text)) {
      confidence += 0.1;
    }

    // Бонус за контакт HR (0.05)
    if (this.extractContactV2(text)) {
      confidence += 0.05;
    }

    return Math.min(1.0, confidence);
  }
} 