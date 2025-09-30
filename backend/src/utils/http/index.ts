/**
 * Экспорты HTTP утилит
 */

// Экспортируем весь функционал из нового объединенного файла
export * from "./HttpClient.js";

// Адаптеры для внешних API оставляем
export { HeadHunterClient } from "./adapters/HeadHunterClient.js";
export * from './adapters/HabrClient.js'; 