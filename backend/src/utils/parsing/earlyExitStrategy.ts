/**
 * Утилита для раннего выхода из парсинга при обнаружении уже существующих данных
 * 
 * Логика: новые вакансии всегда появляются сверху списка, поэтому если на странице
 * все вакансии уже существуют в базе, значит мы дошли до уже обработанных данных
 * и дальнейший парсинг не имеет смысла.
 */

export interface ParsingResult {
  /** Количество новых элементов */
  newCount: number;
  /** Количество существующих элементов */
  existingCount: number;
  /** Общее количество элементов на странице */
  totalCount: number;
  /** Следует ли продолжать парсинг */
  shouldContinue: boolean;
  /** Причина остановки (если shouldContinue = false) */
  stopReason?: string;
}

export interface EarlyExitOptions {
  /** Минимальное количество новых элементов для продолжения парсинга */
  minNewItems?: number;
  /** Максимальный процент существующих элементов (0-1) */
  maxExistingRatio?: number;
  /** Включить подробное логирование */
  verbose?: boolean;
}

export class EarlyExitStrategy {
  /**
   * Обрабатывает страницу элементов с проверкой на ранний выход
   * 
   * @param items - массив элементов для обработки
   * @param checkExists - функция проверки существования элемента
   * @param processNew - функция обработки нового элемента
   * @param options - опции для стратегии выхода
   * @returns результат обработки страницы
   */
  static async processPage<T>(
    items: T[],
    checkExists: (item: T) => Promise<boolean>,
    processNew: (item: T) => Promise<void>,
    options: EarlyExitOptions = {}
  ): Promise<ParsingResult> {
    const {
      minNewItems = 1,
      maxExistingRatio = 1.0,
      verbose = false
    } = options;

    let newCount = 0;
    let existingCount = 0;
    const totalCount = items.length;

    // Обрабатываем каждый элемент
    for (const item of items) {
      try {
        const exists = await checkExists(item);

        if (exists) {
          existingCount++;
          if (verbose) {
            console.log(`  ⚪ Существующий элемент пропущен`);
          }
        } else {
          await processNew(item);
          newCount++;
          if (verbose) {
            console.log(`  ✨ Новый элемент обработан`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Ошибка при обработке элемента:`, error);
        // Считаем ошибку как существующий элемент для консервативного подхода
        existingCount++;
      }
    }

    // Вычисляем процент существующих элементов
    const existingRatio = totalCount > 0 ? existingCount / totalCount : 0;

    // Определяем, следует ли продолжать парсинг
    const shouldContinue = newCount >= minNewItems && existingRatio <= maxExistingRatio;

    let stopReason: string | undefined;
    if (!shouldContinue) {
      if (newCount < minNewItems) {
        stopReason = `слишком мало новых элементов (${newCount} < ${minNewItems})`;
      } else if (existingRatio > maxExistingRatio) {
        stopReason = `слишком много существующих элементов (${(existingRatio * 100).toFixed(1)}% > ${(maxExistingRatio * 100).toFixed(1)}%)`;
      }
    }

    const result: ParsingResult = {
      newCount,
      existingCount,
      totalCount,
      shouldContinue,
      stopReason
    };

    // Логируем результат
    if (verbose || !shouldContinue) {
      console.log(`📊 Страница: ${newCount} новых, ${existingCount} существующих, ${totalCount} всего`);
      if (!shouldContinue) {
        console.log(`🛑 Остановка парсинга: ${stopReason}`);
      }
    }

    return result;
  }

  /**
   * Создает функцию проверки существования вакансии по внешнему ID
   * 
   * @param repository - репозиторий вакансий
   * @param source - источник вакансии
   * @returns функция проверки существования
   */
  static createVacancyExistsChecker(
    repository: any,
    source: string
  ) {
    return async (vacancy: { id: string | number }): Promise<boolean> => {
      try {
        const externalId = `${source}:${vacancy.id}`;
        const existing = await repository.findByExternalId(externalId);
        return !!existing;
      } catch (error) {
        console.warn(`⚠️ Ошибка проверки существования вакансии ${vacancy.id}:`, error);
        return false;
      }
    };
  }

  /**
   * Создает функцию обработки новой вакансии
   * 
   * @param repository - репозиторий вакансий
   * @param transformer - функция трансформации данных
   * @param source - источник вакансии
   * @returns функция обработки новой вакансии
   */
  static createVacancyProcessor(
    repository: any,
    transformer: (vacancy: any) => any,
    source: string
  ) {
    return async (vacancy: any): Promise<void> => {
      try {
        const transformedData = transformer(vacancy);
        const externalId = `${source}:${vacancy.id}`;
        transformedData.externalId = externalId;
        transformedData.source = source;

        await repository.create(transformedData);
        console.log(`✅ Сохранена новая вакансия: "${transformedData.title}" (${source})`);
      } catch (error) {
        console.error(`❌ Ошибка сохранения вакансии ${vacancy.id}:`, error);
        throw error;
      }
    };
  }
}
