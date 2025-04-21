import type { HHResponseType, HHVacancyType } from '@jspulse/shared';
import { HH_API_BASE_URL } from '../config/api';

async function fetchHHVacancies(): Promise<void> {
  try {
    const url = new URL(HH_API_BASE_URL);
    const AREA_ID_RUSSIA = '113'; // ID региона "Россия" на HH.ru
    url.searchParams.set('text', 'JavaScript');
    url.searchParams.set('area', AREA_ID_RUSSIA);
    url.searchParams.set('per_page', '10');
    url.searchParams.set('page', '0');
    url.searchParams.set('professional_role', '96');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JS-Pulse'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json() as HHResponseType; 

    console.log('Получено вакансий:', data.items.length);
    if (data.items.length > 0) {
      const firstVacancy: HHVacancyType = data.items[0];
      console.dir(firstVacancy, { depth: null });
    }

  } catch (err) {
    if (err instanceof Error) { 
      console.error('Ошибка при получении данных:', err.message);
    } else {
      console.error('Произошла неизвестная ошибка:', err);
    }
  }
}

fetchHHVacancies();