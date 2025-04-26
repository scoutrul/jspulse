// import { PUBLIC_BACKEND_URL } from "$env/static/public";

export const API_CONFIG = {
  // Удаляем секцию EXTERNAL_API, так как URL бэкенда получается в http.client.ts
  // EXTERNAL_API: {
  //   BASE_URL: PUBLIC_BACKEND_URL,
  // },
  HH_API: {
    BASE_URL: "https://api.hh.ru",
    VACANCIES_ENDPOINT: "/vacancies",
  },
  // Оставляем эндпоинты, если они где-то используются отдельно от apiClient
  ENDPOINTS: {
    VACANCIES: "api/vacancies",
  },
};
