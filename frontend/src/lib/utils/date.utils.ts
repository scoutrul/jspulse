/**
 * Форматирует строку даты или undefined в локализованную строку (DD.MM.YYYY).
 * @param dateInput - Строка с датой, объект Date, undefined или null.
 * @returns Локализованная строка даты или 'Дата не указана'.
 */
export function formatDate(dateInput: string | Date | number | undefined | null): string {
  try {
    // Проверяем на undefined или null
    if (dateInput === undefined || dateInput === null) {
      return "Дата не указана";
    }

    // Если это объект с getTime методом, используем его
    if (typeof dateInput === 'object' && dateInput !== null && 'getTime' in dateInput) {
      try {
        const timestamp = dateInput.getTime();
        const date = new Date(timestamp);
        return formatDateInstance(date);
      } catch (e) {
        return "Некорректная дата";
      }
    }
    
    // Для строк и чисел
    const date = dateInput instanceof Date ? 
      dateInput : 
      typeof dateInput === 'number' ?
        new Date(dateInput) :
        new Date(String(dateInput));
    
    return formatDateInstance(date);
  } catch (error) {
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
  if (isNaN(date.getTime())) {
    return "Некорректная дата";
  }
  
  // Форматируем дату в локальный формат
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
