import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { VacancyDTO, ApiSingleResponse } from "@jspulse/shared";
import { createHttpClient } from "$lib/utils/http";

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { id } = params;
  const endpoint = `api/vacancies/${id}`;

  try {
    // Создаем HTTP-клиент для SSR с передачей fetch из SvelteKit
    const httpClient = createHttpClient({ 
      baseUrl: import.meta.env.VITE_API_URL || "",
      fetch  // Передаем fetch из контекста SvelteKit
    });
    
    // Получаем данные вакансии
    const response = await httpClient.get<ApiSingleResponse<VacancyDTO>>(endpoint);
    
    // Проверяем статус ответа
    if (!response || response.status === "ERROR" || !response.data) {
      console.error(`[+page.server.ts] API вернул ошибку для вакансии ${id}:`, response?.message || 'Неизвестная ошибка');
      throw error(404, {
        message: response?.message || `Вакансия ${id} не найдена`,
      });
    }
    
    // Проверяем и корректируем данные
    const vacancy = response.data;
    
    // Гарантируем, что дата публикации существует и имеет корректный формат
    if (vacancy.publishedAt === undefined || vacancy.publishedAt === null) {
      // Если дата отсутствует, устанавливаем текущую
      vacancy.publishedAt = new Date();
    } else if (typeof vacancy.publishedAt === 'string') {
      // Если дата в строковом формате, преобразуем в объект Date
      try {
        vacancy.publishedAt = new Date(vacancy.publishedAt);
      } catch (e) {
        console.warn(`[+page.server.ts] Невозможно преобразовать дату публикации: ${vacancy.publishedAt}`);
        vacancy.publishedAt = new Date();
      }
    }
    
    // Гарантируем, что навыки всегда будут массивом
    if (!Array.isArray(vacancy.skills)) {
      vacancy.skills = [];
    }
    
    return {
      vacancy,
    };
  } catch (err) {
    console.error(`[+page.server.ts] Ошибка при загрузке вакансии ${id}:`, err);
    throw error(500, {
      message: `Не удалось загрузить вакансию ${id}`,
    });
  }
};
