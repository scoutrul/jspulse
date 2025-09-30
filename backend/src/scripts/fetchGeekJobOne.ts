import mongoose from "../config/database.js";
import ky from "ky";
import * as cheerio from "cheerio";
import { Vacancy } from "../models/Vacancy.js";
import { DescriptionService } from "../services/DescriptionService.js";
import { containsBackendStopWords, findBackendStopWords } from "../config/backendStopWords.js";
import { normalizeSkill } from "../utils/transformations.js";

const SOURCE = "geekjob.ru";

function detectSkillsFromText(text: string): string[] {
  const lowered = text.toLowerCase();
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
    "node.js", "nodejs", "express", "nestjs"
  ];
  const detected = possibleSkills.filter(skill => lowered.includes(skill)).map(normalizeSkill);
  return Array.from(new Set(detected));
}

async function fetchDetailDescription(detailUrl: string): Promise<{ rawHtml?: string; processedHtml?: string; preview?: string; textOnly?: string } | undefined> {
  try {
    const html = await ky.get(detailUrl, { headers: { 'user-agent': 'Mozilla/5.0 JSPulse' }, timeout: 30000 }).text();
    const $ = cheerio.load(html);

    let raw = $('#vacancy-description').html() || '';

    if (!raw || raw.trim().length === 0) {
      // JSON-LD
      const ldBlocks = $('script[type="application/ld+json"]').toArray();
      for (const el of ldBlocks) {
        try {
          const rawJson = $(el).contents().text();
          const json = JSON.parse(rawJson);
          const arr = Array.isArray(json) ? json : [json];
          for (const item of arr) {
            if (item['@type'] === 'JobPosting' && typeof item.description === 'string') {
              raw = item.description;
              break;
            }
          }
        } catch { }
      }
    }

    // Фолбэки
    if (!raw || raw.trim().length === 0) {
      const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
      raw = metaDesc || $('main, article').first().html() || '';
    }

    if (!raw) return undefined;
    const processed = DescriptionService.processFullDescription(raw);
    return { rawHtml: processed.raw, processedHtml: processed.processed, preview: processed.preview, textOnly: processed.textOnly };
  } catch {
    return undefined;
  }
}

async function run() {
  const url = process.env.GJ_URL;
  if (!url) {
    console.error("GJ_URL is required");
    process.exit(1);
  }

  const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017/jspulse";
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Подключились к MongoDB");

    const idMatch = url.match(/\/vacancy\/([\w\d]+)/);
    const externalId = idMatch ? idMatch[1] : url;

    const detail = await ky.get(url, { headers: { 'user-agent': 'Mozilla/5.0 JSPulse' }, timeout: 30000 }).text();
    const $ = cheerio.load(detail);

    const title = $('h1, .vacancy-title, [data-test*="vacancy-title"]').first().text().trim() || 'Без названия';
    const company = $('.company, [itemprop="hiringOrganization"], [data-test*="company"]').first().text().trim() || 'Неизвестная компания';
    const location = $('.location, [itemprop="addressLocality"], [data-test*="location"]').first().text().trim() || 'Неизвестное местоположение';

    // Публикация из JSON-LD
    let publishedAt: Date = new Date();
    const ldBlocks = $('script[type="application/ld+json"]').toArray();
    for (const el of ldBlocks) {
      try {
        const raw = $(el).contents().text();
        const json = JSON.parse(raw);
        const arr = Array.isArray(json) ? json : [json];
        for (const item of arr) {
          if (item['@type'] === 'JobPosting') {
            const dateStr = item.datePosted || item.datePublished || item.validFrom;
            if (dateStr) publishedAt = new Date(dateStr);
          }
        }
      } catch { }
    }

    const desc = await fetchDetailDescription(url);
    const textBlob = `${title} ${company} ${location} ${desc?.textOnly || ''}`;
    const skills = detectSkillsFromText(textBlob);

    if (containsBackendStopWords(textBlob.toLowerCase())) {
      const found = findBackendStopWords(textBlob.toLowerCase()).slice(0, 5).join(', ');
      console.log(`🚫 Пропущено по стоп-словам: ${found}`);
      return;
    }

    const payload: any = {
      externalId,
      title,
      company,
      location,
      url,
      source: SOURCE,
      publishedAt,
      description: desc?.preview || undefined,
      skills: skills.length ? skills : ['javascript'],
      rawData: { source: 'geekjob-one' }
    };

    if (desc) {
      payload.fullDescription = {
        raw: desc.rawHtml || '',
        preview: desc.preview || '',
        processed: desc.processedHtml || '',
        textOnly: desc.textOnly || ''
      };
      payload.processedHtml = desc.processedHtml || '';
    }

    const existing = await Vacancy.findOne({ externalId, source: SOURCE });
    if (!existing) {
      await Vacancy.create(payload);
      console.log(`✨ Сохранена новая вакансия: ${title}`);
    } else {
      await Vacancy.updateOne({ _id: existing._id }, { ...payload, updatedAt: new Date() });
      console.log(`🔄 Обновлена вакансия: ${title}`);
    }
  } catch (e) {
    console.error("❌ Ошибка парсинга одной вакансии:", e);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

run();


