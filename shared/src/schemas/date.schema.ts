import { z } from "zod";

/**
 * Универсальная схема для валидации дат с предобработкой.
 * Обрабатывает различные форматы входных данных и преобразует их в Date.
 */
export const DateSchema = z.preprocess(
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
 * Схема для опциональной даты
 */
export const OptionalDateSchema = DateSchema.optional().nullable();

/**
 * Схема для строго обязательной даты
 */
export const RequiredDateSchema = DateSchema.refine(
  (date) => date !== null && date !== undefined && !isNaN(date.getTime()),
  {
    message: "Дата обязательна и должна быть корректной",
  }
); 