import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Определяем __dirname для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем переменные окружения из корневого .env файла
// Это важно, т.к. этот конфиг может использоваться в разных местах (скрипты, сервер)
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

/**
 * URI для подключения к MongoDB.
 * Берется из переменной окружения MONGO_URI.
 */
export const MONGO_URI = process.env.MONGO_URI;

/**
 * Базовый URL для API HeadHunter
 */
export const HH_API_BASE_URL = process.env.HH_API_BASE_URL || "https://api.hh.ru";

// Сюда можно будет добавлять URL других API
// export const ANOTHER_API_URL = '...';
