import { z } from "zod";

/**
 * Универсальная схема для валидации дат с предобработкой.
 * Обрабатывает различные форматы входных данных и преобразует их в Date.
 */
export const DateSchema = z.preprocess(
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