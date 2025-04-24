import ky, { type Options, HTTPError } from "ky";
// import { PUBLIC_BACKEND_URL } from "$env/static/public"; // Не используется здесь
// import { INTERNAL_BACKEND_URL } from "$env/dynamic/private"; // Не используется здесь
import { API_CONFIG } from "../config/api.config";

// Add base options configuration
const baseOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
};

// Базовый клиент без prefixUrl
export const apiClient = ky.create({
  // prefixUrl убран
  headers: baseOptions.headers,
  timeout: baseOptions.timeout,
});

// Создаем экземпляр ky для HeadHunter API
export const hhClient = ky.create({
  prefixUrl: API_CONFIG.HH_API.BASE_URL,
  headers: {
    ...baseOptions.headers,
    "User-Agent": "JS-Pulse-App/1.0 (nikita@tonsky.me)",
  },
  timeout: baseOptions.timeout,
});

// Реэкспортируем HTTPError
export { HTTPError };
