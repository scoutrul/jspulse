/**
 * Интерфейс для различных представлений описания вакансии
 */
export interface DescriptionContent {
  /** Исходное HTML описание */
  raw: string;
  /** Краткое превью для карточек */
  preview: string;
  /** Обработанное HTML для отображения */
  processed: string;
  /** Только текст без HTML */
  textOnly: string;
} 