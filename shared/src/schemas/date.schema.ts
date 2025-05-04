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
    
    // Если уже Date, просто возвращаем
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val;
    }
    
    // Если строка или число, пытаемся преобразовать в Date
    if (typeof val === "string" || typeof val === "number") {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Если date-подобный объект с методом getTime
    if (typeof val === "object" && val !== null && "getTime" in val && 
        typeof (val as any).getTime === "function") {
      try {
        const timestamp = (val as any).getTime();
        if (typeof timestamp === "number" && !isNaN(timestamp)) {
          const date = new Date(timestamp);
          return isNaN(date.getTime()) ? null : date;
        }
      } catch {
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