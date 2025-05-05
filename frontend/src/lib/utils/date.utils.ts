import { z } from "zod";
// Создадим тип Date schema самостоятельно
const DateSchema = z.preprocess(
  // Предобработка различных форматов данных
  (val: unknown): Date | null => {
    // Обработка undefined/null
    if (val === undefined || val === null) {
      return null;
    }

    // Если уже Date, просто проверяем валидность
    if (val instanceof Date) {
      const isValid = !isNaN(val.getTime());
      return isValid ? val : null;
    }

    // Если строка, пытаемся преобразовать в Date
    if (typeof val === "string") {
      // Проверка на пустую строку
      if (val.trim() === '') {
        return null;
      }

      // Пытаемся создать Date из строки
      const date = new Date(val);
      const isValid = !isNaN(date.getTime());
      return isValid ? date : null;
    }

    // Если число, интерпретируем как timestamp
    if (typeof val === "number") {
      // Проверка на разумный диапазон дат (после 1970 и до 2100 года)
      if (val < 0 || val > 4102444800000) { // 4102444800000 = 1 января 2100
        return null;
      }

      const date = new Date(val);
      const isValid = !isNaN(date.getTime());
      return isValid ? date : null;
    }

    // Если date-подобный объект с методом getTime
    if (typeof val === "object" && val !== null && "getTime" in val) {
      try {
        if (typeof (val as any).getTime === "function") {
          const timestamp = (val as any).getTime();

          if (typeof timestamp === "number" && !isNaN(timestamp)) {
            const date = new Date(timestamp);
            const isValid = !isNaN(date.getTime());
            return isValid ? date : null;
          }
        }
      } catch (error) {
        return null;
      }
    }

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
    // Дополнительная проверка на null/undefined
    if (dateInput === null || dateInput === undefined) {
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
    } catch (e) {
      console.error('[formatDate] Ошибка при создании тестовой даты:', e);
    }

    // Используем Zod DateSchema для валидации и преобразования
    const result = DateSchema.safeParse(dateInput);

    if (!result.success) {
      return "Дата не указана";
    }

    const date = result.data;

    // Дополнительная проверка на корректность даты
    if (!date || isNaN(date.getTime())) {
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
