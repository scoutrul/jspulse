// import { INTERNAL_BACKEND_URL } from '$env/dynamic/private'; // Убираем импорт

export const API_CONFIG = {
  // Убираем секцию INTERNAL_API или оставляем пустой, т.к. BASE_URL серверный
  // INTERNAL_API: {
  //   BASE_URL: INTERNAL_BACKEND_URL,
  // },
  HH_API: {
    BASE_URL: "https://api.hh.ru",
    VACANCIES_ENDPOINT: "/vacancies",
  },
  ENDPOINTS: {
    // Оставляем только относительные пути
    VACANCIES: "/api/vacancies",
    VACANCIES_FILTER: "/api/vacancies/filter",
    SKILLS_COUNTS: "/api/skills/counts" // Добавим эндпоинт для статистики
  },
} as const;

export default API_CONFIG;
