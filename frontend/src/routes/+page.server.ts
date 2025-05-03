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

  try {
    console.log("[+page.server.ts] Загружаем вакансии и навыки...");

    // Загружаем вакансии
    const vacanciesPath = `api/vacancies?limit=${initialLimit}&page=${initialPage}`;
    console.log(`[+page.server.ts] Запрос вакансий: ${vacanciesPath}`);
    const vacanciesResponse = await fetchApiData<PaginatedVacanciesResponse>(vacanciesPath, _fetch);

    if (
      vacanciesResponse.status !== "OK" ||
      !vacanciesResponse.data ||
      !Array.isArray(vacanciesResponse.data.items)
    ) {
      console.error(
        `[+page.server.ts] API вернул некорректные данные вакансий: status=${vacanciesResponse.status}`,
        vacanciesResponse.data
      );
      error(500, vacanciesResponse.message || "API не вернуло ожидаемые данные вакансий");
    }

    const { items: rawVacancies, total, page, limit, totalPages } = vacanciesResponse.data;
    console.log(`[+page.server.ts] Извлечено вакансий: ${rawVacancies.length}, всего: ${total}`);

    // Преобразуем вакансии
    const vacanciesWithDatesAndHtml = rawVacancies.map((vacancy: VacancyDTO) => ({
      ...vacancy,
      publishedAt: new Date(vacancy.publishedAt),
      htmlDescription: vacancy.description ? purify.sanitize(vacancy.description) : "",
      // Гарантируем, что skills всегда будет массивом
      skills: vacancy.skills && Array.isArray(vacancy.skills) ? vacancy.skills : [],
    }));

    // Загружаем навыки через специальный эндпоинт
    let availableSkills: string[] = [];
    try {
      console.log("[+page.server.ts] Запрос доступных навыков через API");
      const skillsResponse = await fetchApiData<{ data: string[] }>("api/vacancies/skills", _fetch);

      if (skillsResponse.status === "OK" && Array.isArray(skillsResponse.data)) {
        availableSkills = skillsResponse.data;
        console.log(`[+page.server.ts] Получено ${availableSkills.length} навыков через API`);
      } else {
        // Если API не сработал, собираем навыки из полученных вакансий
        const allSkills = new Set<string>();
        vacanciesWithDatesAndHtml.forEach((vacancy) => {
          vacancy.skills?.forEach((skill: string) => {
            if (skill && typeof skill === "string") {
              allSkills.add(skill.trim());
            }
          });
        });
        availableSkills = Array.from(allSkills).sort();
        console.log(
          `[+page.server.ts] Собрано ${availableSkills.length} навыков из вакансий (запасной вариант)`
        );
      }
    } catch (skillsError) {
      console.error("[+page.server.ts] Ошибка при загрузке навыков:", skillsError);
      // При ошибке используем запасной вариант - собираем навыки из вакансий
      const allSkills = new Set<string>();
      vacanciesWithDatesAndHtml.forEach((vacancy) => {
        vacancy.skills?.forEach((skill: string) => {
          if (skill && typeof skill === "string") {
            allSkills.add(skill.trim());
          }
        });
      });
      availableSkills = Array.from(allSkills).sort();
      console.log(
        `[+page.server.ts] Собрано ${availableSkills.length} навыков из вакансий (после ошибки)`
      );
    }

    return {
      initialVacancies: vacanciesWithDatesAndHtml,
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      availableSkills: availableSkills,
    };
  } catch (err) {
    console.error("[+page.server.ts] Общая ошибка загрузки данных:", err);

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
