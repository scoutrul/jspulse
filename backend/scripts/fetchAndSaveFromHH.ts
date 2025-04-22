import mongoose from 'mongoose';
import 'dotenv/config';
import { Vacancy } from '../models/Vacancy.js';
import { transformHHVacancyToIVacancy } from '../utils/transformations.js';
import { HHResponseRaw } from '@jspulse/shared';
import ky, { HTTPError } from 'ky';
import { HH_API_BASE_URL } from '../config/api.js';

const HH_API_URL = 'https://api.hh.ru/vacancies';
const SOURCE_HH = 'hh.ru';
const MAX_VACANCIES_PER_PAGE = 100; // HH API limit
const MAX_PAGES_TO_FETCH = 1; // ПОКА ЧТО 1 страница для простоты
const SEARCH_TEXT = 'JavaScript Developer OR Frontend Developer';

async function fetchAndSaveHHVacancies() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error('Ошибка: Не задана переменная окружения MONGO_URL');
    process.exit(1);
  }

  let connection;
  try {
    // Подключение к БД
    connection = await mongoose.connect(mongoUrl);
    console.log('Успешное подключение к MongoDB');

    let totalReceived = 0;
    let totalNew = 0;
    let totalExisting = 0;

    for (let page = 0; page < MAX_PAGES_TO_FETCH; page++) {
      const searchParams = {
        text: SEARCH_TEXT,
        area: '1', // Москва
        per_page: String(MAX_VACANCIES_PER_PAGE),
        page: String(page),
        professional_role: '96' // Разработчик
      };

      console.log(`Запрос страницы ${page + 1}/${MAX_PAGES_TO_FETCH} с ${HH_API_BASE_URL}... Параметры:`, searchParams);

      try {
        // Используем ky для запроса и парсинга JSON
        const data = await ky.get(HH_API_BASE_URL, {
          searchParams: searchParams,
          headers: {
            'User-Agent': 'JSPulse/1.0 (nikita@tonsky.me)' // Рекомендуется указывать User-Agent с контактом
          },
          timeout: 30000 // Таймаут 30 секунд
        }).json<HHResponseRaw>();

        const receivedCount = data.items.length;
        console.log(`Страница ${page + 1}: Получено ${receivedCount} вакансий.`);
        totalReceived += receivedCount;

        if (receivedCount === 0) {
          console.log('Больше вакансий не найдено, завершаем.');
          break;
        }

        let pageNew = 0;
        let pageExisting = 0;

        for (const hhVacancy of data.items) {
          const transformedData = transformHHVacancyToIVacancy(hhVacancy);
          if (!transformedData) continue;

          const existingVacancy = await Vacancy.findOne({
            externalId: transformedData.externalId,
            source: SOURCE_HH
          });

          if (!existingVacancy) {
            await Vacancy.create({
              ...transformedData,
              source: SOURCE_HH
            });
            pageNew++;
          } else {
            pageExisting++;
          }
        }
        totalNew += pageNew;
        totalExisting += pageExisting;
        console.log(`Страница ${page + 1}: Сохранено ${pageNew}, уже было ${pageExisting}.`);

      } catch (error) {
        console.error(`Ошибка при запросе страницы ${page + 1}:`, error);
        if (error instanceof HTTPError) {
          const errorBody = await error.response.text();
          console.error(`Ответ сервера при ошибке (${error.response.status}):`, errorBody.slice(0, 500));
        }
        // Можно решить, прерывать ли цикл при ошибке или продолжать
      }
    }

    console.log('--- Итоговая статистика --- ');
    console.log(`Всего получено: ${totalReceived}`);
    console.log(`Новых сохранено: ${totalNew}`);
    console.log(`Уже существовало: ${totalExisting}`);
    console.log('---------------------------');

  } catch (error) {
    // Ошибки подключения к БД или другие общие ошибки
    console.error('Произошла критическая ошибка во время выполнения скрипта:', error);
  } finally {
    // Закрытие соединения с БД
    if (connection) {
      await mongoose.disconnect();
      console.log('Соединение с MongoDB закрыто');
    }
  }
}

// Запуск скрипта
fetchAndSaveHHVacancies(); 

export default fetchAndSaveHHVacancies; 