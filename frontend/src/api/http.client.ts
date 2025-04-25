import ky, { type Options, HTTPError } from "ky";
import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { API_CONFIG } from "../config/api.config";

if (!PUBLIC_BACKEND_URL) {
  console.error(
    "FATAL: Переменная окружения PUBLIC_BACKEND_URL не найдена! Укажите ее в frontend/.env или в environment Docker-сервиса"
  );
}

const baseOptions: Options = {
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
};

export const apiClient = ky.create({
  prefixUrl: PUBLIC_BACKEND_URL,
  headers: baseOptions.headers,
  timeout: baseOptions.timeout,
});

export const hhClient = ky.create({
  prefixUrl: API_CONFIG.HH_API.BASE_URL,
  headers: {
    ...baseOptions.headers,
    "User-Agent": "JS-Pulse-App/1.0 (nikita@tonsky.me)",
  },
  timeout: baseOptions.timeout,
});

export { HTTPError };
