import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
import { fetchApiData } from "$lib/api/http.server";

interface HomePageData {
  initialVacancies: (VacancyDTO & { htmlDescription?: string })[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  availableSkills: string[];
  error?: string;
}

export const load: PageServerLoad<HomePageData> = async ({ fetch: _fetch }) => {
  const { JSDOM } = await import("jsdom");
  const DOMPurifyModule = await import("dompurify");
  const DOMPurify = DOMPurifyModule.default || DOMPurifyModule;

  const window = new JSDOM("").window;
  const purify = DOMPurify(window);

  const initialLimit = 10;
  const initialPage = 0;
  const relativeApiPath = `api/vacancies?limit=${initialLimit}&page=${initialPage}`;
  console.log(`[+page.server.ts] Fetching data from relative path: ${relativeApiPath}`);

  try {
    const response = await fetchApiData<PaginatedVacanciesResponse>(relativeApiPath, _fetch);

    if (response.status !== "OK" || !response.data || !Array.isArray(response.data.items)) {
      console.error(
        `[+page.server.ts] API вернул некорректные данные: status=${response.status}, data=`,
        response.data
      );
      error(500, response.message || "API не вернуло ожидаемые данные вакансий (items)");
    }

    const { items: rawVacancies, total, page, limit, totalPages } = response.data;
    console.log(`[+page.server.ts] Извлечено вакансий: ${rawVacancies.length}, всего: ${total}`);

    const vacanciesWithDatesAndHtml = rawVacancies.map((vacancy: VacancyDTO) => ({
      ...vacancy,
      publishedAt: new Date(vacancy.publishedAt),
      htmlDescription: vacancy.description ? purify.sanitize(vacancy.description) : "",
    }));

    const allSkills = new Set<string>();
    vacanciesWithDatesAndHtml.forEach((vacancy: VacancyDTO & { htmlDescription?: string }) => {
      vacancy.skills?.forEach((skill: string) => {
        if (skill && typeof skill === "string") {
          allSkills.add(skill.trim());
        }
      });
    });
    const availableSkills = Array.from(allSkills).sort();
    console.log(`[+page.server.ts] Unique skills found: ${availableSkills.length}`);

    return {
      initialVacancies: vacanciesWithDatesAndHtml,
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      availableSkills: availableSkills,
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
      page: 0,
      limit: initialLimit,
      totalPages: 0,
      availableSkills: [],
      error: message,
    };
  }
};
