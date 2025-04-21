import mongoose from 'mongoose';
import 'dotenv/config'; // Для загрузки переменных окружения (например, DB_URL)
import { Vacancy } from '../models/Vacancy';
import { transformHHVacancy, HHVacancyResponseItem } from '../utils/transformations';

const HH_API_URL = 'https://api.hh.ru/vacancies';
const SOURCE_HH = 'hh.ru';

interface HHResponse {
  items: HHVacancyResponseItem[];
  pages: number;
  page: number;
  per_page: number;
  found: number;
}

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

    let receivedCount = 0;
    let newCount = 0;
    let existingCount = 0;

    // --- Логика получения данных с HH --- 
    // Пока получаем только одну страницу (100 вакансий)
    // TODO: Реализовать пагинацию для получения 3-5 страниц
    const params = new URLSearchParams({
      text: 'javascript OR typescript OR node.js OR frontend OR backend OR fullstack',
      area: '113', // Россия
      per_page: '100',
      page: '0',
      professional_role: '96' // Разработчик
    });
    
    console.log(`Запрос вакансий с ${HH_API_URL}?${params.toString()}`);
    
    const response = await fetch(`${HH_API_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'JSPulse' // Рекомендуется указывать User-Agent
      }
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP при запросе к HH API: ${response.status} ${response.statusText}`);
    }

    const data: HHResponse = await response.json();
    receivedCount = data.items.length;
    console.log(`Получено ${receivedCount} вакансий с HH.`);

    // --- Логика обработки и сохранения --- 
    for (const hhVacancy of data.items) {
      const transformedData = transformHHVacancy(hhVacancy);
      
      // Проверяем, существует ли вакансия с таким externalId и source
      const existingVacancy = await Vacancy.findOne({
        externalId: transformedData.externalId,
        source: SOURCE_HH
      });

      if (!existingVacancy) {
        // Вакансии нет - создаем
        await Vacancy.create({
          ...transformedData,
          source: SOURCE_HH
        });
        newCount++;
      } else {
        // Вакансия уже есть
        existingCount++;
      }
    }

    console.log('--- Статистика --- ');
    console.log(`Всего получено: ${receivedCount}`);
    console.log(`Новых сохранено: ${newCount}`);
    console.log(`Уже существовало: ${existingCount}`);
    console.log('------------------');

  } catch (error) {
    console.error('Произошла ошибка во время выполнения скрипта:', error);
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