import { PUBLIC_BACKEND_URL } from "$env/static/public";

export const API_CONFIG = {
  EXTERNAL_API: {
    BASE_URL: PUBLIC_BACKEND_URL,
  },
  HH_API: {
    BASE_URL: "https://api.hh.ru",
    VACANCIES_ENDPOINT: "/vacancies",
  },
  ENDPOINTS: {
    VACANCIES: "api/vacancies",
  },
};
