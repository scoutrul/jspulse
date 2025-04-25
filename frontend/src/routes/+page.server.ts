import { error } from "@sveltejs/kit";
// import ky from 'ky'; // Больше не нужен напрямую
import type { PageServerLoad } from "./$types";
// Убираем старый тип ответа
// import type { VacanciesResponseDTO } from '../../../shared/types/dto/VacanciesResponseDTO';
// Импортируем правильный тип PaginatedVacanciesResponse
import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
// import type { SkillCountsDTO } from '../../../shared/types/dto/SkillsDTO'; // Убираем неиспользуемый тип
// import { apiClient } from '../api/http.client'; // Убрали
// import { PUBLIC_BACKEND_URL } from '$env/static/public'; // Убрали
import { fetchApiData } from "$lib/utils/apiUtils"; // Используем $lib alias
// import { JSDOM } from 'jsdom';        // Убираем статический импорт
// import DOMPurify from 'dompurify'; // Убираем статический импорт

// Убираем настройку DOMPurify отсюда
// const window = new JSDOM('').window;
// const purify = DOMPurify(window);

// Обновляем тип возвращаемых данных load функции
interface HomePageData {
  // initialVacancies должен быть массивом VacancyDTO
  initialVacancies: (VacancyDTO & { htmlDescription?: string })[];
  totalCount: number;
  // Добавляем информацию о пагинации, если она нужна на странице
  page?: number;
  limit?: number;
  totalPages?: number;
  // skillCounts: SkillCountsDTO; // Убираем поле
  error?: string; // Для передачи ошибки на страницу
}

export const load: PageServerLoad<HomePageData> = async ({ fetch: _fetch }) => {
  // Динамически импортируем jsdom и dompurify ТОЛЬКО на сервере при выполнении load
  const { JSDOM } = await import("jsdom");
  // DOMPurify может экспортироваться как default, проверяем это
  const DOMPurifyModule = await import("dompurify");
  const DOMPurify = DOMPurifyModule.default || DOMPurifyModule;

  // Настройка DOMPurify теперь внутри load
  const window = new JSDOM("").window;
  const purify = DOMPurify(window);

  // Убираем чтение из process.env
  // const backendUrl = process.env.PUBLIC_BACKEND_URL;

  const relativeApiPath = "api/vacancies?limit=999&page=0"; // Используем относительный путь БЕЗ начального слеша
  console.log(`[+page.server.ts] Fetching data from relative path: ${relativeApiPath}`);

  try {
    // Вызов утилиты для получения данных
    const response = await fetchApiData<PaginatedVacanciesResponse>(relativeApiPath);

    // --- Специфичная обработка успешного ответа ---
    // Проверяем структуру ответа уже ПОСЛЕ успешного запроса
    if (response.status !== "OK" || !response.data) {
      console.error(`[+page.server.ts] API вернул non-OK статус или пустые данные:`, response);
      // Выбрасываем ошибку, т.к. данные не соответствуют ожиданиям
      error(500, response.message || "API не вернуло ожидаемые данные вакансий");
    }

    const { vacancies: rawVacancies, total, page, limit, totalPages } = response.data;
    console.log(`[+page.server.ts] Извлечено вакансий: ${rawVacancies.length}, всего: ${total}`);

    // Преобразуем строки дат в объекты Date
    const vacanciesWithDatesAndHtml = rawVacancies.map((vacancy: VacancyDTO) => ({
      ...vacancy,
      publishedAt: new Date(vacancy.publishedAt),
      // Добавляем очищенный HTML
      htmlDescription: vacancy.description ? purify.sanitize(vacancy.description) : "",
    }));

    return {
      initialVacancies: vacanciesWithDatesAndHtml,
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      // skillCounts: skillCountsResponse, // Убираем
    };
    // --- Конец специфичной обработки ---
  } catch (err) {
    // Ловим ошибки, проброшенные из fetchApiData (уже в формате SvelteKit HttpError)
    // или ошибки при обработке данных выше
    console.error(
      "[+page.server.ts] Ошибка после вызова fetchApiData или при обработке данных:",
      err
    );

    // Если это ошибка SvelteKit (HttpError), она уже содержит status и message
    // Можно пробросить ее дальше или вернуть структуру с ошибкой
    // Возвращаем структуру с ошибкой для отображения на странице
    const message =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Не удалось загрузить данные вакансий";

    return {
      initialVacancies: [],
      totalCount: 0,
      error: message,
    };
  }
};
