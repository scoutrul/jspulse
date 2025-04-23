/**
 * Форматирует строку даты или undefined в локализованную строку (DD MMMM YYYY).
 * @param dateString - Строка с датой (например, в ISO формате) или undefined.
 * @returns Локализованная строка даты или 'Не указана'.
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Не указана';
  try {
    const date = new Date(dateString);
    // Проверка на валидность даты после парсинга
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date string received: ${dateString}`);
        return 'Некорректная дата';
    }
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch (error) {
      console.error(`Error formatting date string: ${dateString}`, error);
      return 'Ошибка формата';
  }
}; 