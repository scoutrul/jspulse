import mongoose from "../config/database.js";
import ky, { HTTPError } from "ky";
import { transformHHVacancyToIVacancy, transformHHVacancyWithFullDescription } from "../utils/transformations.js";
import { normalizeSkill } from "../utils/transformations.js";
import { containsBackendStopWords } from "../config/backendStopWords.js";
import { EarlyExitStrategy } from "../utils/parsing/earlyExitStrategy.js";
import type { HHResponseRaw } from "@jspulse/shared";
import dotenv from "dotenv";
dotenv.config();
import { HH_API_BASE_URL } from "../config/api.js";

// Функция для получения модели в скриптах
async function getVacancyModel() {
  // mongoose уже импортирован

  const vacancySchema = new mongoose.Schema(
    {
      externalId: { type: String, unique: true, sparse: true },
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String },
      url: { type: String, required: true },
      publishedAt: { type: Date, required: true },
      source: { type: String, required: true },
      description: { type: String },
      fullDescription: {
        type: {
          raw: { type: String },
          preview: { type: String },
          processed: { type: String },
          textOnly: { type: String }
        },
        default: undefined
      },
      processedHtml: { type: String },
      schedule: { type: String },
      skills: [{ type: String }],
      salaryFrom: { type: Number },
      salaryTo: { type: Number },
      salaryCurrency: { type: String },
      experience: { type: String },
      employment: { type: String },
      address: { type: String },

      sourceId: { type: String, unique: true, sparse: true },
      sourceChannel: { type: String },
      sourceUrl: { type: String },
      contact: { type: String },
      workFormat: { type: String },
      hashtags: [{ type: String }],
      confidence: { type: Number },
      parsedAt: { type: Date },

      rawData: { type: mongoose.Schema.Types.Mixed },
    },
    {
      timestamps: true,
      versionKey: false,
      collection: "vacancies",
    }
  );

  vacancySchema.index({ publishedAt: -1 });

  return mongoose.model("Vacancy", vacancySchema);
}

const SOURCE_HH = "hh.ru";
const MAX_VACANCIES_PER_PAGE = 10; // HH API limit
const MAX_PAGES_TO_FETCH = 50; // Увеличено до 50 для получения 500 вакансий
const START_PAGE = parseInt(process.env.START_PAGE || "0", 10); // Начальная страница (можно задать через START_PAGE=20)
const SEARCH_TEXT = "JavaScript Developer OR Frontend Developer";
const FETCH_FULL_DESCRIPTIONS = process.env.FETCH_FULL_DESCRIPTIONS !== "false"; // По умолчанию ВКЛЮЧЕНО, можно выключить через false

async function fetchAndSaveHHVacancies() {
  console.log("🚀 Запускаю incremental импорт вакансий с HeadHunter...");
  console.log(`📊 Настройки: страницы ${START_PAGE + 1}-${START_PAGE + MAX_PAGES_TO_FETCH} (${MAX_PAGES_TO_FETCH} страниц) × ${MAX_VACANCIES_PER_PAGE} = до ${MAX_PAGES_TO_FETCH * MAX_VACANCIES_PER_PAGE} вакансий`);
  console.log(`🔍 Получение полных описаний: ${FETCH_FULL_DESCRIPTIONS ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО'}`);

  // Используем MongoDB внутри Docker сети
  const mongoUrl = process.env.MONGO_URI || "mongodb://mongodb:27017/jspulse";

  let connection;
  try {
    // mongoose уже импортирован
    connection = await mongoose.connect(mongoUrl);
    console.log("✅ Успешное подключение к MongoDB");

    // Получаем модель
    const Vacancy = await getVacancyModel();

    // Проверяем текущее состояние БД
    const initialCount = await Vacancy.countDocuments();
    console.log(`📋 Текущее количество вакансий в БД: ${initialCount}`);

    let totalReceived = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (let page = START_PAGE; page < START_PAGE + MAX_PAGES_TO_FETCH; page++) {
      const searchParams = {
        text: SEARCH_TEXT,
        area: "1", // Москва
        per_page: String(MAX_VACANCIES_PER_PAGE),
        page: String(page),
        professional_role: "96", // Разработчик
      };

      console.log(
        `📄 Запрос страницы ${page + 1}/${START_PAGE + MAX_PAGES_TO_FETCH} с ${HH_API_BASE_URL}...`
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
          console.error(`❌ Ошибка: Ответ от API не содержит 'items'. Полный ответ:`, data);
          return;
        }

        const receivedCount = data.items.length;
        console.log(`📄 Страница ${page + 1}: Получено ${receivedCount} вакансий от HH API`);
        totalReceived += receivedCount;

        if (receivedCount === 0) {
          console.log("🏁 Больше вакансий не найдено, завершаем.");
          break;
        }

        // Используем стратегию раннего выхода для обработки страницы
        const result = await EarlyExitStrategy.processPage(
          data.items,
          // Функция проверки существования вакансии
          async (hhVacancy) => {
            const transformedData = transformHHVacancyToIVacancy(hhVacancy);
            if (!transformedData) return true; // Считаем ошибку трансформации как существующую

            const existingVacancy = await Vacancy.findOne({
              externalId: transformedData.externalId,
              source: SOURCE_HH,
            });
            return !!existingVacancy;
          },
          // Функция обработки новой вакансии
          async (hhVacancy) => {
            let transformedData;

            try {
              if (FETCH_FULL_DESCRIPTIONS) {
                // Используем расширенную трансформацию с получением полного описания
                transformedData = await transformHHVacancyWithFullDescription(hhVacancy, true);
                // Добавляем небольшую задержку между запросами к деталям вакансий (джиттер)
                const jitter = 200 + Math.floor(Math.random() * 400);
                await new Promise(resolve => setTimeout(resolve, jitter));
              } else {
                // Используем базовую трансформацию
                transformedData = transformHHVacancyToIVacancy(hhVacancy);
              }
            } catch (err: any) {
              const msg = String(err?.message || err || '');
              console.warn(`⏳ HH detail fetch failed, fallback to basic transform: ${msg}`);
              // Fallback на базовую трансформацию без полного описания
              transformedData = transformHHVacancyToIVacancy(hhVacancy);
              // Бэк-офф перед следующими запросами (джиттер)
              const backoff = 600 + Math.floor(Math.random() * 900);
              await new Promise(r => setTimeout(r, backoff));
            }

            if (!transformedData) {
              throw new Error('Ошибка трансформации вакансии');
            }

            // Проверяем стоп-слова для технологий бэкенда (кроме Node.js)
            const vacancyText = `${transformedData.title} ${transformedData.description || ''}`.toLowerCase();
            if (containsBackendStopWords(vacancyText)) {
              console.log(`  🚫 ПРОПУЩЕНА (стоп-слова): "${transformedData.title}"`);
              throw new Error('Вакансия содержит стоп-слова');
            }

            // Проверяем, что есть skills для фильтрации
            if (
              !transformedData.skills ||
              !Array.isArray(transformedData.skills) ||
              transformedData.skills.length === 0
            ) {
              // Если навыков нет, добавляем хотя бы один базовый навык из заголовка вакансии
              const titleWords = transformedData.title.toLowerCase().split(/\W+/);
              const possibleSkills = [
                "javascript", "js", "typescript", "ts",
                "react", "reactjs", "react.js", "nextjs", "next.js",
                "redux", "redux-toolkit", "redux toolkit",
                "vue", "vuejs", "vue.js", "vuex", "pinia", "nuxt", "nuxtjs", "nuxt.js",
                "angular", "rxjs",
                "svelte", "sveltekit",
                "webpack", "vite", "babel", "eslint", "prettier",
                "jest", "vitest", "testing-library", "testing library", "cypress", "playwright", "storybook",
                "tailwind", "tailwindcss", "scss", "sass", "styled-components", "styled components", "emotion",
                "graphql", "apollo",
                "three.js", "threejs", "d3", "chart.js", "chartjs", "webgl", "pwa", "service worker",
                "html", "html5", "css", "css3",
                "frontend", "backend"
              ];
              const detectedSkills = possibleSkills.filter(
                (skill) =>
                  titleWords.includes(skill) ||
                  (transformedData.description &&
                    transformedData.description.toLowerCase().includes(skill))
              ).map(normalizeSkill);

              transformedData.skills = detectedSkills.length > 0 ? detectedSkills : ["javascript"]; // Дефолтный навык, если ничего не найдено
            }

            // Создаем новую вакансию
            await Vacancy.create(transformedData);
            console.log(`  ✨ НОВАЯ: "${transformedData.title}" (ID: ${transformedData.externalId})`);
          },
          {
            minNewItems: 1, // Минимум 1 новая вакансия для продолжения
            maxExistingRatio: 1.0, // Максимум 100% существующих вакансий
            verbose: true
          }
        );

        totalNew += result.newCount;
        totalUpdated += result.existingCount; // Существующие считаем как обновленные
        totalSkipped += result.totalCount - result.newCount - result.existingCount;

        console.log(`📄 Страница ${page + 1} итог: ✨${result.newCount} новых, 🔄${result.existingCount} обновлено, ❌${result.totalCount - result.newCount - result.existingCount} пропущено`);

        // Если все вакансии на странице уже существуют, прекращаем парсинг
        if (!result.shouldContinue) {
          console.log(`🛑 Остановка парсинга: ${result.stopReason}`);
          break;
        }

        // Добавляем небольшую задержку между запросами для избежания rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Ошибка при обработке страницы ${page + 1}:`, error);
        if (error instanceof HTTPError) {
          console.error(`📋 Ответ сервера (${error.response.status}):`, await error.response.text());
        }
      }
    }

    console.log("\n🎯 ИТОГОВАЯ СТАТИСТИКА INCREMENTAL UPDATE:");
    console.log(`📊 Всего получено от API: ${totalReceived}`);
    console.log(`✨ Новых добавлено: ${totalNew}`);
    console.log(`🔄 Обновлено существующих: ${totalUpdated}`);
    console.log(`❌ Пропущено (ошибки трансформации): ${totalSkipped}`);

    const finalCount = await Vacancy.countDocuments();
    console.log(`📋 Было в БД: ${initialCount} → Стало: ${finalCount} (изменение: +${finalCount - initialCount})`);
    console.log("🎉 Merge операция завершена успешно! Дубликаты исключены.");
  } catch (error) {
    console.error("❌ Ошибка при выполнении импорта:", error);
  } finally {
    // Закрываем соединение
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

// Запускаем процесс
fetchAndSaveHHVacancies();
