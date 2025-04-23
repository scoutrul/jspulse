declare const VITE_BACKEND_URL: string;

// Конфигурация API endpoints и базовых URL
const getBaseUrl = () => {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    return process.env.VITE_BACKEND_URL || "http://localhost:3001";
  }
  // @ts-ignore - Vite заполнит import.meta.env во время сборки
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  HH_API: {
    BASE_URL: "https://api.hh.ru",
    VACANCIES_ENDPOINT: "/vacancies",
  },
  ENDPOINTS: {
    VACANCIES: "/api/vacancies",
    VACANCIES_FILTER: "/api/vacancies/filter",
  },
} as const;

export default API_CONFIG;
