import mongoose from "../config/database.js";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { HabrClient } from "../utils/http/adapters/HabrClient.js";
import { containsBackendStopWords } from "../config/backendStopWords.js";
import { normalizeSkill } from "../utils/transformations.js";

dotenv.config();

// Встроенная модель как в HH-скрипте
async function getVacancyModel() {
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
          textOnly: { type: String },
        },
        default: undefined,
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
      logoUrl: { type: String },
      isRemote: { type: Boolean },
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

const SOURCE = "habr";
const START_URL = "vacancies";
const BASE_PARAMS = {
  "locations[]": "ct_444",
  "s[]": "3",
  type: "all",
};
const MAX_PAGES = 5;

function extractText($el: cheerio.Cheerio<any>): string {
  return $el.text().replace(/\s+/g, " ").trim();
}

function makeShort(text: string, limit = 500): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  const slice = trimmed.slice(0, limit);
  const lastDot = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"), slice.lastIndexOf("?"));
  return (lastDot > 100 ? slice.slice(0, lastDot + 1) : slice) + "…";
}

async function fetchAndSaveFromHabr() {
  console.log("🚀 Запускаю импорт с Habr Career…");
  const mongoUrl = process.env.MONGO_URI || "mongodb://mongodb:27017/jspulse";

  let connection;
  try {
    connection = await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB подключен");

    const Vacancy = await getVacancyModel();
    const client = new HabrClient({ logging: false });

    let totalReceived = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const collectedLinks: string[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const params = { ...BASE_PARAMS, page } as Record<string, string | number>;
      console.log(`📄 Страница списка ${page}/${MAX_PAGES}`);
      const { html, url } = await client.getListPage(params);
      const $ = cheerio.load(html);

      // Карточки вакансий: уточнить селекторы по текущей верстке Habr Career
      const cards = $("[data-qa='vacancy-card'] , .vacancy-card, .job, .vacancy");
      if (cards.length === 0 && page > 1) {
        console.log("🏁 Похоже, вакансии закончились. Останавливаюсь.");
        break;
      }

      cards.each((_, el) => {
        const linkEl = $(el).find("a[href*='/vacancies/']").first();
        const href = linkEl.attr("href");
        if (href) {
          const abs = href.startsWith("http") ? href : `https://career.habr.com${href}`;
          collectedLinks.push(abs);
        }
      });

      console.log(`🔗 Собрано ссылок: ${collectedLinks.length} (страница ${page})`);
      await new Promise((r) => setTimeout(r, 500));
    }

    const uniqueLinks = Array.from(new Set(collectedLinks));

    for (const vacancyUrl of uniqueLinks) {
      try {
        const { html } = await client.getVacancyPage(vacancyUrl);
        const $ = cheerio.load(html);

        const title = extractText($("h1, .vacancy-title, [data-qa='vacancy-title']").first());
        const company = extractText($(".company_name, .company, [data-qa='vacancy-company'] a").first());
        // Извлечение местоположения и типа занятости из секции
        let location = extractText($(".location, [data-qa='vacancy-location']").first()) || "";
        let employment: string | undefined;
        const locSection = $(".content-section").filter((_, el) => extractText($(el).find(".content-section__title").first()).includes("Местоположение и тип занятости")).first();
        if (locSection && locSection.length > 0) {
          const line = extractText(locSection.find(".inline-list").first());
          if (line) {
            const parts = line.split("•").map(s => s.trim()).filter(Boolean);
            if (parts[0]) location = parts[0];
            if (parts[1]) employment = parts[1];
          } else {
            const cityLink = locSection.find("a[href*='city_id=']").first();
            if (cityLink.length) location = extractText(cityLink);
            const afterSep = locSection.find(".inline-separator").parent().next();
            if (afterSep && afterSep.length) employment = extractText(afterSep);
          }
        }

        const descriptionEl = $(".vacancy-description__text").first();
        const rawHtml = descriptionEl.html() || "";
        const textOnly = descriptionEl.text().replace(/\s+/g, " ").trim();
        const preview = makeShort(textOnly, 500);

        // Логотип (минимальный формат)
        const logoAttr = $("img[alt*='logo'], .company_logo img, [data-qa='vacancy-company-logo'] img").first().attr("src") || "";
        const logoUrl = logoAttr ? (logoAttr.startsWith("http") ? logoAttr : `https://career.habr.com${logoAttr}`) : undefined;

        // Определяем удаленный формат по тексту
        const isRemote = /удаленн|remote/i.test(textOnly) || /удаленн|remote/i.test(location);

        const sourceIdMatch = vacancyUrl.match(/\/vacancies\/([^\/?#]+)/i);
        const sourceId = sourceIdMatch ? sourceIdMatch[1] : vacancyUrl;

        const transformed = {
          externalId: `${SOURCE}:${sourceId}`,
          title,
          company,
          location,
          url: vacancyUrl,
          publishedAt: new Date(),
          source: SOURCE,
          description: preview,
          fullDescription: {
            raw: rawHtml,
            preview,
            processed: rawHtml, // обработка будет в DescriptionService при отображении
            textOnly,
          },
          skills: extractSkills(title + " " + textOnly),
          logoUrl,
          isRemote,
          employment,
          sourceId,
          sourceUrl: vacancyUrl,
          confidence: 0.95,
          parsedAt: new Date(),
        } as any;

        // Фильтрация по стоп-словам бэкенда
        if (containsBackendStopWords((title + " " + preview).toLowerCase())) {
          totalSkipped++;
          console.log(`  🚫 ПРОПУЩЕНА (стоп-слова): "${title}"`);
          continue;
        }

        const existing = await Vacancy.findOne({ sourceUrl: vacancyUrl });
        if (!existing) {
          await Vacancy.create(transformed);
          totalNew++;
          console.log(`  ✨ НОВАЯ: "${title}" (${vacancyUrl})`);
        } else {
          const res = await Vacancy.updateOne({ _id: existing._id }, { ...transformed, updatedAt: new Date() });
          if (res.modifiedCount > 0) {
            totalUpdated++;
            console.log(`  🔄 ОБНОВЛЕНА: "${title}" (${vacancyUrl})`);
          } else {
            console.log(`  ⚪ БЕЗ ИЗМЕНЕНИЙ: "${title}" (${vacancyUrl})`);
          }
        }

        totalReceived++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        totalSkipped++;
        console.error("❌ Ошибка парсинга вакансии:", vacancyUrl, err);
      }
    }

    console.log("\n🎯 ИТОГ Habr:");
    console.log(`📊 Получено: ${totalReceived}`);
    console.log(`✨ Новых: ${totalNew}`);
    console.log(`🔄 Обновлено: ${totalUpdated}`);
    console.log(`❌ Пропущено: ${totalSkipped}`);
  } catch (error) {
    console.error("❌ Ошибка импорта Habr:", error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const possible = [
    "javascript", "typescript", "react", "next", "redux", "vue", "nuxt", "angular", "rxjs",
    "svelte", "webpack", "vite", "babel", "eslint", "jest", "vitest", "cypress", "playwright",
    "tailwind", "scss", "sass", "graphql", "apollo", "pwa", "webgl", "html", "css",
  ];
  return Array.from(new Set(possible.filter((k) => lower.includes(k)).map(normalizeSkill)));
}

fetchAndSaveFromHabr();
