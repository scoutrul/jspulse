import type { HHResponse, HHVacancy } from '../../shared/src/types/hh.types'; // Импортируем типы
import { HH_API_BASE_URL } from '../config/api';

async function fetchHHVacancies(): Promise<void> { // Добавил тип возвращаемого значения
  try {
    const url = new URL(HH_API_BASE_URL);
    url.searchParams.set('text', 'JavaScript');
    url.searchParams.set('area', '113'); // Россия
    url.searchParams.set('per_page', '10');
    url.searchParams.set('page', '0');
    url.searchParams.set('professional_role', '96');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JS-Pulse-Test' // Рекомендуется использовать специфичный User-Agent
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    // Указываем тип ожидаемого ответа с помощью утверждения типа
    const data = await response.json() as HHResponse; 

    console.log('Получено вакансий:', data.items.length);
    if (data.items.length > 0) {
      // Типизируем первую вакансию для лучшего автодополнения
      const firstVacancy: HHVacancy = data.items[0]; 
      console.dir(firstVacancy, { depth: null }); // детальный вывод
    }

  } catch (err) {
    // Уточняем тип ошибки
    if (err instanceof Error) { 
      console.error('Ошибка при получении данных:', err.message);
    } else {
      console.error('Произошла неизвестная ошибка:', err);
    }
  }
}

fetchHHVacancies();