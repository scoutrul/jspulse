import ky, { HTTPError as KyHTTPError } from "ky";
// import { API_CONFIG } from "../config/api.config"; // Убрали зависимость

// Получаем базовый URL API из переменных окружения Vite
// Используем `import.meta.env` для доступа к переменным окружения на клиенте
const backendBaseUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL;

if (!backendBaseUrl) {
  console.error(
    "VITE_PUBLIC_BACKEND_URL is not defined. Please check your .env file and Vite configuration."
  );
  // Можно выбросить ошибку или использовать значение по умолчанию, если это применимо
  // throw new Error("Backend URL is not configured");
}

console.log("Backend Base URL:", backendBaseUrl); // Для отладки

// Базовые опции для экземпляра ky
const baseOptions = {
  prefixUrl: backendBaseUrl, // Используем переменную окружения
  headers: {
    "Content-Type": "application/json",
  },
  // timeout: API_CONFIG.timeout, // Убираем timeout, так как его нет в API_CONFIG
  // retry: API_CONFIG.retry, // Опции retry тоже убрали, если они не нужны
};

console.log("Base Ky Options:", baseOptions); // Для отладки

// Создаем экземпляр ky с базовыми опциями и хуками
const apiClient = ky.extend({
  ...baseOptions,
  hooks: {
    beforeRequest: [
      (request) => {
        console.log("Sending request:", request.method, request.url); // Логируем запрос
        // Пример: добавление токена авторизации
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //   request.headers.set('Authorization', `Bearer ${token}`);
        // }
      },
    ],
    afterResponse: [
      // Оставляем только один хук afterResponse
      async (request, options, response) => {
        // Этот хук будет вызван ТОЛЬКО для успешных ответов (статус 2xx),
        // если throwHttpErrors: true (по умолчанию).
        // Ошибки HTTPError или сетевые ошибки будут выброшены ДО этого хука.
        console.log(
          `Received successful response: ${response.status} from ${request.method} ${request.url}`
        );
        // Можем добавить обработку, если нужно, но для простого логирования ничего не возвращаем.
        // Если нужно изменить Response перед возвратом в основной код, возвращаем новый Response.
        // return new Response('modified body', response);

        // Ничего не возвращаем, чтобы использовать оригинальный response
      },
      // Убираем второй хук entirely. Обработка ошибок (HTTPError, сетевых)
      // должна происходить через try/catch вокруг вызовов apiClient.get/post/etc.
    ],
  },
});

// Экспортируем КОРРЕКТНО apiClient вместе с KyHTTPError
export { apiClient, KyHTTPError };
