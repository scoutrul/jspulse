import { DateSchema, z } from "@jspulse/shared";

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
    
    console.log(`[formatDate] Input type: ${typeof dateInput}`, dateInput);
    
    // Используем Zod DateSchema для валидации и преобразования
    const result = DateSchema.safeParse(dateInput);
    
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
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
