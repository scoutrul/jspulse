import "dotenv/config";

// Выбираем MongoDB URI в зависимости от среды запуска
// Если запускаемся локально (вне Docker), используем MONGO_URI_LOCALHOST
// Иначе используем основной MONGO_URI (в Docker)
export const MONGO_URI =
  process.env.NODE_ENV === "development"
    ? process.env.MONGO_URI_LOCALHOST || process.env.MONGO_URI
    : process.env.MONGO_URI;

export const HH_API_BASE_URL = process.env.HH_API_BASE_URL;
