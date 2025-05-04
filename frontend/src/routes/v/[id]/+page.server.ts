import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { VacancyDTOSchema, type VacancyDTO } from "@jspulse/shared";
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
    // Уже валидировано через Zod в сервисном слое
    const vacancy = await fetchVacancyByIdServer(fetch, id, sanitizeHtmlFunc);
    
    // Проверяем статус ответа
    if (!vacancy) {
      console.error(`[+page.server.ts load] Вакансия с ID ${id} не найдена`);
      throw error(404, "Вакансия не найдена");
    }
    
    // Дополнительная проверка через Zod для гарантии
    const validationResult = VacancyDTOSchema.safeParse(vacancy);
    
    if (!validationResult.success) {
      console.error(`[+page.server.ts] Ошибка валидации вакансии ${id}:`, validationResult.error);
      throw error(500, "Получены некорректные данные вакансии");
    }
    
    // Печатаем детальную информацию об объекте вакансии
    console.log(`[+page.server.ts] Передаем данные вакансии:`, {
      id: vacancy._id,
      title: vacancy.title,
      publishedAt: vacancy.publishedAt,
      publishedAtType: typeof vacancy.publishedAt
    });
    
    return {
      vacancy: validationResult.data
    };
  } catch (err) {
    if (err instanceof Error) {
      console.error(`[+page.server.ts load] Ошибка при загрузке вакансии ${id}:`, err);
      throw error(500, err.message || "Ошибка при загрузке вакансии");
    }
    throw err;
  }
};
