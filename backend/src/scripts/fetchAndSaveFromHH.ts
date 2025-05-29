import mongoose from "mongoose";
import ky, { HTTPError } from "ky";
import { Vacancy } from "../models/Vacancy.js";
import { transformHHVacancyToIVacancy } from "../utils/transformations.js";
import type { HHResponseRaw } from "@jspulse/shared";
import dotenv from "dotenv";
dotenv.config();
import { HH_API_BASE_URL } from "../config/api.js";

const SOURCE_HH = "hh.ru";
const MAX_VACANCIES_PER_PAGE = 10; // HH API limit
const MAX_PAGES_TO_FETCH = 5;
const SEARCH_TEXT = "JavaScript Developer OR Frontend Developer";

async function fetchAndSaveHHVacancies() {
  console.log("Запускаю импорт вакансий с HeadHunter...");
  // Принудительно используем локальный MongoDB
  const mongoUrl = "mongodb://localhost:27017/jspulse";

  let connection;
  try {
    connection = await mongoose.connect(mongoUrl);
    console.log("Успешное подключение к MongoDB");

    let totalReceived = 0;
    let totalNew = 0;
    let totalExisting = 0;

    for (let page = 0; page < MAX_PAGES_TO_FETCH; page++) {
      const searchParams = {
        text: SEARCH_TEXT,
        area: "1", // Москва
        per_page: String(MAX_VACANCIES_PER_PAGE),
        page: String(page),
        professional_role: "96", // Разработчик
      };

      console.log(
        `Запрос страницы ${page + 1}/${MAX_PAGES_TO_FETCH} с ${HH_API_BASE_URL}... Параметры:`,
        searchParams
      );

      try {
        const data = await ky
          .get(HH_API_BASE_URL + "/vacancies", {
            searchParams: searchParams,
            headers: {
              "User-Agent": "JSPulse",
              "HH-User-Agent": "JSPulse",
            },
            timeout: 30000,
          })
          .json<HHResponseRaw>();

        if (!data.items) {
          console.error(`Ошибка: Ответ от API не содержит 'items'. Полный ответ:`, data);
          return;
        }

        const receivedCount = data.items.length;
        console.log(`Страница ${page + 1}: Получено ${receivedCount} вакансий.`);
        totalReceived += receivedCount;

        if (receivedCount === 0) {
          console.log("Больше вакансий не найдено, завершаем.");
          break;
        }

        let pageNew = 0;
        let pageExisting = 0;

        for (const hhVacancy of data.items) {
          const transformedData = transformHHVacancyToIVacancy(hhVacancy);
          if (!transformedData) continue;

          // Проверяем, что есть skills для фильтрации
          if (
            !transformedData.skills ||
            !Array.isArray(transformedData.skills) ||
            transformedData.skills.length === 0
          ) {
            // Если навыков нет, добавляем хотя бы один базовый навык из заголовка вакансии
            const titleWords = transformedData.title.toLowerCase().split(/\W+/);
            const possibleSkills = [
              "javascript",
              "react",
              "vue",
              "angular",
              "typescript",
              "frontend",
              "backend",
            ];
            const detectedSkills = possibleSkills.filter(
              (skill) =>
                titleWords.includes(skill) ||
                (transformedData.description &&
                  transformedData.description.toLowerCase().includes(skill))
            );

            transformedData.skills = detectedSkills.length > 0 ? detectedSkills : ["javascript"]; // Дефолтный навык, если ничего не найдено

            console.log(
              `Для вакансии "${transformedData.title}" добавлены навыки: ${transformedData.skills.join(", ")}`
            );
          }

          const existingVacancy = await Vacancy.findOne({
            externalId: transformedData.externalId,
            source: SOURCE_HH,
          });

          if (!existingVacancy) {
            await Vacancy.create(transformedData);
            pageNew++;
          } else {
            // Обновляем существующую вакансию
            // Можно использовать Object.assign и save(), или updateOne()
            // updateOne() может быть эффективнее, т.к. не требует загрузки всего документа
            await Vacancy.updateOne({ _id: existingVacancy._id }, transformedData);
            // Можно добавить логирование, что вакансия была обновлена
            // console.log(`Вакансия "${existingVacancy.title}" (ID: ${existingVacancy._id}) обновлена.`);
            pageExisting++; // Считаем ее как "уже существующую", но обновленную
          }
        }
        totalNew += pageNew;
        totalExisting += pageExisting;
        console.log(`Страница ${page + 1}: Сохранено ${pageNew}, уже было ${pageExisting}.`);
      } catch (error) {
        console.error(`Ошибка при запросе страницы ${page + 1}:`, error);
        if (error instanceof HTTPError) {
          const errorBody = await error.response.text();
          console.error(
            `Ответ сервера при ошибке (${error.response.status}):`,
            errorBody.slice(0, 500)
          );
        }
        // Можно решить, прерывать ли цикл при ошибке или продолжать
      }
    }

    console.log("Итоговая статистика: ");
    console.log(`Всего получено: ${totalReceived}`);
    console.log(`Новых сохранено: ${totalNew}`);
    console.log(`Уже существовало: ${totalExisting}`);
  } catch (error) {
    console.error("Произошла критическая ошибка во время выполнения скрипта:", error);
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log("Соединение с MongoDB закрыто");
    }
  }
}

fetchAndSaveHHVacancies();

export default fetchAndSaveHHVacancies;
