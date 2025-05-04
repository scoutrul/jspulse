import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { VacancyDTO } from "@jspulse/shared";
import { fetchVacancyByIdServer } from "$lib/services/vacancy.server";
import { sanitizeHtml } from "$lib/utils/sanitizeHtml";

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = params.id;
  
  console.log(`[+page.server.ts load] Запрос вакансии с ID: ${id}`);
  
  try {
    // Инициализируем DOMPurify для санитизации HTML
    const { JSDOM } = await import("jsdom");
    const DOMPurifyModule = await import("dompurify");
    const DOMPurify = DOMPurifyModule.default || DOMPurifyModule;

    const window = new JSDOM("").window;
    const purify = DOMPurify(window);
    const sanitizeHtmlFunc = (html: string) => purify.sanitize(html);

    // Получаем данные вакансии через сервисный слой
    const vacancy = await fetchVacancyByIdServer(fetch, id, sanitizeHtmlFunc);
    
    // Проверяем статус ответа
    if (!vacancy) {
      console.error(`[+page.server.ts load] Вакансия с ID ${id} не найдена`);
      return {
        status: 404,
        error: "Вакансия не найдена"
      };
    }
    
    // Проверяем наличие даты и делаем глубокую копию объекта для безопасной модификации
    const safeVacancy = JSON.parse(JSON.stringify(vacancy));
    
    // Если даты нет, устанавливаем текущую
    if (!safeVacancy.publishedAt) {
      console.log(`[+page.server.ts] Дата публикации отсутствует, устанавливаем текущую`);
      safeVacancy.publishedAt = new Date().toISOString();
    }
    
    // Печатаем детальную информацию об объекте вакансии
    console.log(`[+page.server.ts] Передаем данные вакансии:`, {
      id: safeVacancy.id,
      title: safeVacancy.title,
      publishedAt: safeVacancy.publishedAt,
      publishedAtType: typeof safeVacancy.publishedAt
    });
    
    return {
      vacancy: safeVacancy
    };
  } catch (error) {
    console.error(`[+page.server.ts load] Ошибка при загрузке вакансии ${id}:`, error);
    return {
      status: 500,
      error: "Ошибка при загрузке вакансии"
    };
  }
};
