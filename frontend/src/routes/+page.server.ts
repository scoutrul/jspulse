import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
// @ts-ignore // eslint-disable-line @typescript-eslint/ban-ts-comment
import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
import { fetchApiData } from "$lib/utils/apiUtils";

interface HomePageData {
  initialVacancies: (VacancyDTO & { htmlDescription?: string })[];
  totalCount: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  error?: string;
}

export const load: PageServerLoad<HomePageData> = async ({ fetch: _fetch }) => {
  const { JSDOM } = await import("jsdom");
  const DOMPurifyModule = await import("dompurify");
  const DOMPurify = DOMPurifyModule.default || DOMPurifyModule;

  const window = new JSDOM("").window;
  const purify = DOMPurify(window);

  const relativeApiPath = "api/vacancies?limit=999&page=0";
  console.log(`[+page.server.ts] Fetching data from relative path: ${relativeApiPath}`);

  try {
    const response = await fetchApiData<PaginatedVacanciesResponse>(relativeApiPath);

    if (response.status !== "OK" || !response.data) {
      console.error(`[+page.server.ts] API вернул non-OK статус или пустые данные:`, response);
      error(500, response.message || "API не вернуло ожидаемые данные вакансий");
    }

    const { vacancies: rawVacancies, total, page, limit, totalPages } = response.data;
    console.log(`[+page.server.ts] Извлечено вакансий: ${rawVacancies.length}, всего: ${total}`);

    const vacanciesWithDatesAndHtml = rawVacancies.map((vacancy: VacancyDTO) => ({
      ...vacancy,
      publishedAt: new Date(vacancy.publishedAt),
      htmlDescription: vacancy.description ? purify.sanitize(vacancy.description) : "",
    }));

    return {
      initialVacancies: vacanciesWithDatesAndHtml,
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
    };
  } catch (err) {
    console.error(
      "[+page.server.ts] Ошибка после вызова fetchApiData или при обработке данных:",
      err
    );

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
