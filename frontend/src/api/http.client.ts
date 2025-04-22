import ky, { Options } from 'ky';
import { API_CONFIG } from '../config/api.config';

// Базовые опции для ky
const baseOptions: Options = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // Хуки можно добавить здесь, если нужна глобальная логика
  // hooks: {
  //   beforeRequest: [...],
  //   afterResponse: [...] 
  // }
};

// Создаем экземпляр ky для внутреннего API
// Обратите внимание: префикс URL добавляется к КАЖДОМУ запросу
export const apiClient = ky.create({
  prefixUrl: API_CONFIG.BASE_URL, // Используем prefixUrl
  headers: baseOptions.headers,
  timeout: baseOptions.timeout
});

// Создаем экземпляр ky для HeadHunter API
export const hhClient = ky.create({
  prefixUrl: API_CONFIG.HH_API.BASE_URL, // Используем prefixUrl
  headers: {
    ...baseOptions.headers,
    'User-Agent': 'JS-Pulse-App/1.0 (nikita@tonsky.me)' // Укажем контакт
  },
  timeout: baseOptions.timeout
});

// Интерцепторы axios удалены.
// Код, использующий apiClient или hhClient, должен будет вызывать
// методы парсинга ответа, например: apiClient.get('vacancies').json<VacancyDTO[]>()
