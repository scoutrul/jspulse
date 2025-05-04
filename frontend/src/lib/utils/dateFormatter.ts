/**
 * Безопасно форматирует дату, независимо от типа входного значения
 * 
 * @param dateInput Дата в любом формате (строка, объект Date, timestamp)
 * @returns Отформатированная дата в формате ДД.ММ.ГГГГ
 */
export function formatDateSafe(dateInput: any): string {
  // Проверка на пустые значения
  if (dateInput === null || dateInput === undefined) {
    return "Не указана";
  }
  
  try {
    // Преобразуем в объект Date, если это не Date
    let date: Date;
    
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'object' && 'getTime' in dateInput) {
      date = new Date(dateInput.getTime());
    } else {
      console.warn("Неизвестный формат даты:", dateInput);
      return "Не указана";
    }
    
    // Проверяем валидность даты
    if (isNaN(date.getTime())) {
      console.warn("Невалидная дата:", dateInput);
      return "Не указана";
    }
    
    // Форматируем
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit", 
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch (error) {
    console.error("Ошибка форматирования даты:", error);
    return "Не указана";
  }
} 