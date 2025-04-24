import { error } from '@sveltejs/kit';
// import ky from 'ky'; // Больше не нужен напрямую
import type { PageServerLoad } from './$types';
// Убираем старый тип ответа
// import type { VacanciesResponseDTO } from '../../../shared/types/dto/VacanciesResponseDTO';
// Импортируем правильный тип PaginatedVacanciesResponse
import type { PaginatedVacanciesResponse, VacancyDTO } from '@jspulse/shared';
// import type { SkillCountsDTO } from '../../../shared/types/dto/SkillsDTO'; // Убираем неиспользуемый тип
import { apiClient } from '../api/http.client';
// Убираем импорт из $env
// import { PUBLIC_BACKEND_URL } from '$env/dynamic/public';

// Обновляем тип возвращаемых данных load функции
interface HomePageData {
  // initialVacancies должен быть массивом VacancyDTO
  initialVacancies: VacancyDTO[];
  totalCount: number;
  // Добавляем информацию о пагинации, если она нужна на странице
  page?: number;
  limit?: number;
  totalPages?: number;
  // skillCounts: SkillCountsDTO; // Убираем поле
  error?: string; // Для передачи ошибки на страницу
}

export const load: PageServerLoad<HomePageData> = async ({ fetch }) => {
  // Читаем переменную напрямую из process.env
  const backendUrl = process.env.PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    console.error("FATAL: Переменная окружения PUBLIC_BACKEND_URL не найдена в process.env");
    error(500, { message: 'Не настроен PUBLIC_BACKEND_URL в process.env' });
  }

  const apiUrl = `${backendUrl}/api/vacancies?limit=999&page=0`;
  console.log(`[+page.server.ts] Fetching data from: ${apiUrl}`); // Оставляем лог URL

  try {
    const response = await apiClient.get(apiUrl).json<PaginatedVacanciesResponse>();

    console.log(`[+page.server.ts] Received API response status: ${response.status}`);

    if (response.status !== 'OK' || !response.data) {
      console.error(`[+page.server.ts] API returned non-OK status or no data:`, response);
      throw new Error(response.message || 'API не вернуло данные');
    }

    const { vacancies: rawVacancies, total, page, limit, totalPages } = response.data;

    console.log(`[+page.server.ts] Extracted vacancies count: ${rawVacancies.length}, total: ${total}`);

    // Преобразуем строки дат в объекты Date перед передачей в компонент
    const vacanciesWithDates = rawVacancies.map((vacancy: VacancyDTO) => ({
      ...vacancy,
      publishedAt: new Date(vacancy.publishedAt), // Преобразование
    }));

    return {
      initialVacancies: vacanciesWithDates, // Передаем преобразованный массив
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      // skillCounts: skillCountsResponse, // Убираем
    };
  } catch (err) {
    console.error('[+page.server.ts] Error loading data:', err);
    const message = err instanceof Error ? err.message : 'Не удалось загрузить данные';
    // Возвращаем пустые данные и сообщение об ошибке
    // Можно также выбросить ошибку SvelteKit: error(500, { message });
    return {
      initialVacancies: [],
      totalCount: 0,
      error: message,
    };
  }
};