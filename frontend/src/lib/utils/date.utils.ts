/**
 * Форматирует строку даты или undefined в локализованную строку (DD MMMM YYYY).
 * @param dateString - Строка с датой (например, в ISO формате), объект Date, undefined или null.
 * @returns Локализованная строка даты или 'Дата не указана'.
 */
export function formatDate(dateString: string | Date | undefined | null): string {
  try {
    // Если значение отсутствует, возвращаем стандартное сообщение
    if (dateString === undefined || dateString === null) {
      return "Дата не указана";
    }

    const date = typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      console.warn(`[formatDate] Invalid date value received: ${dateString}`);
      return "Некорректная дата";
    }

    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch (error) {
    console.error("[formatDate] Error formatting date:", error);
    return "Ошибка форматирования";
  }
}
