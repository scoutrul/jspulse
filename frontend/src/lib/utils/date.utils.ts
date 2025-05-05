import { z } from "zod";
// Создадим тип Date schema самостоятельно
const DateSchema = z.preprocess(
  // Предобработка различных форматов данных
  (val: unknown): Date | null => {
    // Debug-логирование входного значения
    console.log(`[DateSchema] Валидация даты, входные данные:`, {
      value: val,
      type: typeof val,
      isNull: val === null,
      isUndefined: val === undefined,
      isDate: val instanceof Date,
      isObject: typeof val === 'object' && val !== null
    });

    // Обработка undefined/null
    if (val === undefined || val === null) {
      console.log(`[DateSchema] Получено null/undefined, возвращаем null`);
      return null;
    }

    // Если уже Date, просто проверяем валидность
    if (val instanceof Date) {
      const isValid = !isNaN(val.getTime());
      console.log(`[DateSchema] Получен Date, валидность:`, isValid);
      return isValid ? val : null;
    }

    // Если строка, пытаемся преобразовать в Date
    if (typeof val === "string") {
      console.log(`[DateSchema] Получена строка:`, val);

      // Проверка на пустую строку
      if (val.trim() === '') {
        console.log(`[DateSchema] Пустая строка, возвращаем null`);
        return null;
      }

      // Пытаемся создать Date из строки
      const date = new Date(val);
      const isValid = !isNaN(date.getTime());
      console.log(`[DateSchema] Валидность строки как даты:`, isValid);
      return isValid ? date : null;
    }

    // Если число, интерпретируем как timestamp
    if (typeof val === "number") {
      console.log(`[DateSchema] Получено число:`, val);

      // Проверка на разумный диапазон дат (после 1970 и до 2100 года)
      if (val < 0 || val > 4102444800000) { // 4102444800000 = 1 января 2100
        console.log(`[DateSchema] Число вне разумного диапазона, возвращаем null`);
        return null;
      }

      const date = new Date(val);
      const isValid = !isNaN(date.getTime());
      console.log(`[DateSchema] Валидность числа как timestamp:`, isValid);
      return isValid ? date : null;
    }

    // Если date-подобный объект с методом getTime
    if (typeof val === "object" && val !== null && "getTime" in val) {
      console.log(`[DateSchema] Получен объект с методом getTime`);

      try {
        if (typeof (val as any).getTime === "function") {
          const timestamp = (val as any).getTime();

          if (typeof timestamp === "number" && !isNaN(timestamp)) {
            const date = new Date(timestamp);
            const isValid = !isNaN(date.getTime());
            console.log(`[DateSchema] Валидность объекта с getTime:`, isValid);
            return isValid ? date : null;
          }
        }
      } catch (error) {
        console.log(`[DateSchema] Ошибка при вызове getTime:`, error);
        return null;
      }
    }

    console.log(`[DateSchema] Неподдерживаемый формат даты:`, val);
    return null;
  },
  // Собственно валидация
  z.date({
    invalid_type_error: "Некорректный формат даты",
    required_error: "Дата обязательна",
  })
);

/**
 * Форматирует дату в локализованную строку (DD.MM.YYYY HH:MM)
 * с использованием Zod для валидации входных данных.
 * 
 * @param dateInput - Любой поддерживаемый формат даты 
 * @returns Локализованная строка даты или сообщение об ошибке
 */
export function formatDate(dateInput: unknown): string {
  try {
    // Лог входного значения с подробным анализом
    console.log(`[formatDate] ДЕТАЛЬНАЯ ДИАГНОСТИКА:`, {
      input: dateInput,
      type: typeof dateInput,
      isNull: dateInput === null,
      isUndefined: dateInput === undefined,
      isDate: dateInput instanceof Date,
      isString: typeof dateInput === 'string',
      isNumber: typeof dateInput === 'number',
      isObject: typeof dateInput === 'object' && dateInput !== null,
      hasGetTime: dateInput !== null &&
        typeof dateInput === 'object' &&
        'getTime' in (dateInput as object)
    });

    // Дополнительная проверка на null/undefined
    if (dateInput === null || dateInput === undefined) {
      console.log('[formatDate] Входное значение null/undefined');
      return "Дата не указана";
    }

    // Безопасно создаем объект Date для тестирования
    let testDate: Date | null = null;
    try {
      if (dateInput instanceof Date) {
        testDate = dateInput;
      } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        testDate = new Date(dateInput);
      } else if (typeof dateInput === 'object' && 'getTime' in (dateInput as any)) {
        const timestamp = (dateInput as any).getTime();
        if (typeof timestamp === 'number') {
          testDate = new Date(timestamp);
        }
      }

      // Проверяем результат создания Date
      console.log('[formatDate] Попытка создания Date:', {
        testDate,
        isValid: testDate && !isNaN(testDate.getTime()),
        timestamp: testDate ? testDate.getTime() : null
      });
    } catch (e) {
      console.error('[formatDate] Ошибка при создании тестовой даты:', e);
    }

    // Используем Zod DateSchema для валидации и преобразования
    const result = DateSchema.safeParse(dateInput);

    // Лог результата валидации
    console.log(`[formatDate] Результат валидации Zod:`, {
      success: result.success,
      error: result.success ? null : result.error.message,
      data: result.success ? result.data : null
    });

    if (!result.success) {
      console.warn(`[formatDate] Невалидная дата:`, result.error);
      return "Дата не указана";
    }

    const date = result.data;

    // Дополнительная проверка на корректность даты
    if (!date || isNaN(date.getTime())) {
      console.warn(`[formatDate] Невалидная дата после парсинга:`, date);
      return "Дата не указана";
    }

    // Форматируем дату в локальный формат
    const formatted = new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    console.log(`[formatDate] Успешно отформатирована дата:`, {
      input: dateInput,
      parsed: date,
      formatted
    });

    return formatted;
  } catch (error) {
    console.error(`[formatDate] Ошибка форматирования:`, error);
    return "Ошибка форматирования";
  }
}

/**
 * Форматирует объект Date в локализованную строку
 * @param date - Объект Date для форматирования
 * @returns Локализованная строка даты
 */
function formatDateInstance(date: Date): string {
  // Проверяем валидность даты
  if (!date || isNaN(date.getTime())) {
    return "Некорректная дата";
  }

  try {
    // Форматируем дату в локальный формат
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (e) {
    console.error(`[formatDateInstance] Error formatting date:`, e);
    return "Ошибка форматирования";
  }
}
