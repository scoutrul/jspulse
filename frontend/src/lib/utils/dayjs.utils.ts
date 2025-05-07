import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/ru';

// Инициализация плагинов и локализации
dayjs.extend(customParseFormat);
dayjs.locale('ru');

/**
 * Безопасно форматирует дату в формат ДД.ММ.ГГГГ ЧЧ:ММ
 * 
 * @param dateInput - Дата в любом формате (Date, string, number, null)
 * @returns Форматированная дата или сообщение об отсутствии
 */
export function formatDate(dateInput: unknown): string {
  try {
    // Проверка на пустые значения
    if (dateInput === null || dateInput === undefined) {
      return "Дата не указана";
    }

    // Создаем dayjs инстанс в зависимости от типа входных данных
    let date;
    if (dateInput instanceof Date) {
      date = dayjs(dateInput);
    } else if (typeof dateInput === 'string') {
      date = dayjs(dateInput);
    } else if (typeof dateInput === 'number') {
      date = dayjs(dateInput);
    } else if (typeof dateInput === 'object' && 'getTime' in (dateInput as any)) {
      try {
        const timestamp = (dateInput as any).getTime();
        date = dayjs(timestamp);
      } catch (e) {
        return "Дата не указана";
      }
    } else {
      return "Дата не указана";
    }

    // Проверка валидности даты
    if (!date.isValid()) {
      return "Дата не указана";
    }

    // Форматируем в локализованный формат с временем
    return date.format('DD.MM.YYYY HH:mm');
  } catch (error) {
    console.error(`[formatDate] Ошибка форматирования:`, error);
    return "Ошибка форматирования";
  }
}

/**
 * Безопасно форматирует дату в формат ДД.ММ.ГГГГ (без времени)
 * 
 * @param dateInput - Дата в любом формате (строка, объект Date, timestamp)
 * @returns Отформатированная дата в формате ДД.ММ.ГГГГ
 */
export function formatDateSafe(dateInput: any): string {
  try {
    // Проверка на пустые значения
    if (dateInput === null || dateInput === undefined) {
      return "Не указана";
    }

    // Создаем dayjs инстанс в зависимости от типа входных данных
    let date;
    if (dateInput instanceof Date) {
      date = dayjs(dateInput);
    } else if (typeof dateInput === 'string') {
      date = dayjs(dateInput);
    } else if (typeof dateInput === 'number') {
      date = dayjs(dateInput);
    } else if (typeof dateInput === 'object' && 'getTime' in dateInput) {
      try {
        const timestamp = dateInput.getTime();
        date = dayjs(timestamp);
      } catch (e) {
        return "Не указана";
      }
    } else {
      return "Не указана";
    }

    // Проверка валидности даты
    if (!date.isValid()) {
      return "Не указана";
    }

    // Форматируем в локализованный формат без времени
    return date.format('DD.MM.YYYY');
  } catch (error) {
    console.error("Ошибка форматирования даты:", error);
    return "Не указана";
  }
} 