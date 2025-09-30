import mongoose from "../config/database.js";
import ky from "ky";
import * as cheerio from "cheerio";
import { Vacancy } from "../models/Vacancy.js";
import { containsBackendStopWords, findBackendStopWords } from "../config/backendStopWords.js";
import { normalizeSkill } from "../utils/transformations.js";
import { DescriptionService } from "../services/DescriptionService.js";

const SOURCE = "geekjob.ru";

const QUERY = process.env.GJ_QUERY || "frontend react javascript typescript";
const TAGS = process.env.GJ_T || "2,3,302"; // Официальные теги фронтенда на GeekJob
const MAX_PAGES = parseInt(process.env.GJ_MAX_PAGES || "10", 10);
const REQUEST_DELAY_MS = parseInt(process.env.GJ_REQUEST_DELAY || "500", 10);
const DETAIL_DELAY_MS = parseInt(process.env.GJ_DETAIL_DELAY || "300", 10);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

// Достаточно фильтрации по тегам, allowlist не используем

// Явный denylist по заголовку
const TITLE_DENY_KEYWORDS = ['backend', 'php', 'python', 'c++'];

// Возвращает ПОЛНЫЙ HTML описания (с сохранением форматирования)
async function fetchDetailDescription(detailUrl: string): Promise<string | undefined> {
  try {
    const html = await ky.get(detailUrl, { headers: { 'user-agent': 'Mozilla/5.0 JSPulse' }, timeout: 30000 }).text();
    const $ = cheerio.load(html);

    // 0) Прямой блок описания — берём ИМЕННО innerHTML, чтобы сохранить заголовки/списки
    const directHtml = $('#vacancy-description').html();
    if (directHtml && directHtml.trim().length > 0) return directHtml.trim();

    // 1) JSON-LD JobPosting
    const ldBlocks = $('script[type="application/ld+json"]').toArray();
    for (const el of ldBlocks) {
      try {
        const raw = $(el).contents().text();
        const json = JSON.parse(raw);
        const arr = Array.isArray(json) ? json : [json];
        for (const item of arr) {
          if (item['@type'] === 'JobPosting' && typeof item.description === 'string') {
            // В JSON-LD description обычно HTML — возвращаем как есть
            const html = String(item.description).trim();
            return html || undefined;
          }
        }
      } catch { }
    }

    // 2) Метаданные как HTML-замена (оборачиваем в <p>)
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    if (metaDesc) return `<p>${metaDesc}</p>`;

    // 3) Типичные блоки — берём самый информативный блок HTML
    const candidates: Array<{ len: number, html: string }> = [];
    $('section, article, main, .container, [role="main"], div').each((_, el) => {
      const htmlBlock = $(el).html() || '';
      const text = $(el).text().trim();
      if (!text) return;
      if (text.length > 300) {
        const lower = text.toLowerCase();
        if (lower.includes('куки') || lower.includes('политик') || lower.includes('подпис')) return;
        candidates.push({ len: text.length, html: htmlBlock });
      }
    });
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.len - a.len);
      return candidates[0].html.trim();
    }

    return undefined;
  } catch (e) {
    return undefined;
  }
}

function buildSearchUrl(query: string, page: number): string {
  const q = encodeURIComponent(query);
  const pageParam = page > 1 ? `&page=${page}` : "";
  return `https://geekjob.ru/vacancies?qs=${q}${pageParam}`;
}

function isVacancyLink(href: string): boolean {
  // Карточка вакансии: /vacancy/<digits>-<slug> или /vacancy/<digits>
  return /\/vacancy\/(\d+)(?:-[\w-]+)?(?:$|\/?|\?)/.test(href);
}

function extractExternalIdFromHref(href: string): string | null {
  const m = href.match(/\/vacancy\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchVacancyUrlsFromList(html: string, baseUrl: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $('a[href]').each((_, a) => {
    const href = String($(a).attr('href'));
    if (!href) return;
    if (isVacancyLink(href)) {
      const full = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
      links.add(full);
    }
  });
  return Array.from(links);
}

function parseFromJsonLd($: cheerio.CheerioAPI, pageUrl: string) {
  const ldBlocks = $('script[type="application/ld+json"]').toArray();
  for (const el of ldBlocks) {
    try {
      const raw = $(el).contents().text();
      const json = JSON.parse(raw);
      const arr = Array.isArray(json) ? json : [json];
      for (const item of arr) {
        if (item['@type'] === 'JobPosting' || item['@type'] === 'Job') {
          const title = item.title || item.name;
          const company = item.hiringOrganization?.name || item.employer?.name || "Неизвестная компания";
          const location = item.jobLocation?.address?.addressLocality || item.jobLocation?.address?.addressRegion || "Неизвестное местоположение";
          const url = item.url || pageUrl;
          const dateStr = item.datePosted || item.datePublished || item.validFrom;
          const descriptionHtml = item.description || '';

          const salary = item.baseSalary?.value || item.baseSalary;
          const salaryFrom = salary?.minValue ?? salary?.value ?? undefined;
          const salaryTo = salary?.maxValue ?? undefined;
          const salaryCurrency = salary?.currency ?? undefined;

          const textBlob = `${title} ${company} ${location} ${descriptionHtml}`.toLowerCase();
          const skills = detectSkillsFromText(textBlob);

          const externalId = item.identifier?.value || item.identifier || extractExternalIdFromHref(url) || undefined;

          return {
            externalId: externalId || `${SOURCE}:${url}`,
            title: title || 'Без названия',
            company,
            location,
            url,
            source: SOURCE,
            publishedAt: dateStr ? new Date(dateStr) : new Date(),
            description: typeof descriptionHtml === 'string' ? cheerio.load(descriptionHtml).text().trim() : undefined,
            skills: skills.length ? skills : ['javascript'],
            salaryFrom,
            salaryTo,
            salaryCurrency,
            rawData: item
          } as const;
        }
      }
    } catch { }
  }
  return null;
}

async function parseVacancyDetail(html: string, pageUrl: string) {
  const $ = cheerio.load(html);

  const jsonLd = parseFromJsonLd($, pageUrl);
  if (jsonLd) return jsonLd;

  const title = $('h1, .vacancy-title, [data-test*="vacancy-title"]').first().text().trim() || $('title').first().text().trim();
  const company = $('.company, [itemprop="hiringOrganization"], [data-test*="company"]').first().text().trim() || 'Неизвестная компания';
  const location = $('.location, [itemprop="addressLocality"], [data-test*="location"]').first().text().trim() || 'Неизвестное местоположение';

  const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
  let descriptionText = $('[itemprop="description"], [data-test*="vacancy-description"], .description, article, main').text().trim();
  if (!descriptionText || descriptionText.length < 200) {
    const candidates: string[] = [];
    $('section, article, main, .container, [role="main"], div').each((_, el) => {
      const text = $(el).text().trim();
      if (!text) return;
      if (text.length > 300) {
        const lower = text.toLowerCase();
        if (lower.includes('куки') || lower.includes('политик') || lower.includes('подпис')) return;
        candidates.push(text);
      }
    });
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.length - a.length);
      descriptionText = candidates[0];
    }
  }
  if (!descriptionText && metaDesc) descriptionText = metaDesc;

  const textBlob = `${title} ${company} ${location} ${descriptionText || ''}`;
  const skills = detectSkillsFromText(textBlob);
  const externalId = extractExternalIdFromHref(pageUrl) || `${SOURCE}:${pageUrl}`;

  return {
    externalId,
    title: title || 'Без названия',
    company,
    location,
    url: pageUrl,
    source: SOURCE,
    publishedAt: new Date(),
    description: descriptionText || undefined,
    skills: skills.length ? skills : ['javascript'],
    rawData: { fallback: true }
  } as const;
}

function coalesce<T = any>(obj: any, keys: string[], fallback?: T): T | undefined {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return fallback;
}

async function run() {
  console.log("🚀 Запускаю парсинг GeekJob (HTML)");
  const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017/jspulse";
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Подключились к MongoDB");

    let totalFound = 0, totalNew = 0, totalUpdated = 0, totalSkipped = 0;

    for (let page = 1; page <= MAX_PAGES; page++) {
      // Используем фильтр по тегам (t=2,3,302) для фронтенда
      const listJsonUrl = `https://geekjob.ru/json/find/vacancy?page=${page}&t=${encodeURIComponent(TAGS)}`;
      console.log(`📄 JSON список: ${listJsonUrl}`);
      try {
        const data = await ky.get(listJsonUrl, { headers: { 'user-agent': 'Mozilla/5.0 JSPulse', 'accept': 'application/json' }, timeout: 30000 }).json<any>();
        const items: any[] = Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.data) ? data.data
            : Array.isArray(data) ? data
              : [];
        console.log(`  → Получено элементов: ${items.length}`);
        if (items.length === 0 && page > 1) break;

        for (const it of items) {
          try {
            const id = String(it.id || '');
            const title = String(it.position || 'Без названия');
            const company = String(it.company?.name || 'Неизвестная компания');
            const location = (it.city && String(it.city).trim().length > 0) ? String(it.city) : 'Неизвестное местоположение';
            let descriptionHtml = undefined as string | undefined; // Полный HTML описания (raw)
            const publishedAt = new Date(coalesce<string>(it, ['published_at', 'created_at', 'date']) || Date.now());
            const salaryFrom = coalesce<number>(it, ['salary_from', 'salary_min']);
            const salaryTo = coalesce<number>(it, ['salary_to', 'salary_max']);
            const salaryCurrency = coalesce<string>(it, ['currency', 'salary_currency']) || undefined;

            const url = id ? `https://geekjob.ru/vacancy/${id}` : `https://geekjob.ru/vacancies?qs=${encodeURIComponent(QUERY)}`;
            // Если описания нет — пробуем подтянуть со страницы вакансии (HTML)
            if (!descriptionHtml && id) {
              descriptionHtml = await fetchDetailDescription(url);
            }

            const skills = detectSkillsFromText(`${title} ${company} ${location}`);

            // Фильтрация: исключаем по заголовку backend/php/python/c++
            const titleLower = `${title}`.toLowerCase();
            if (TITLE_DENY_KEYWORDS.some(k => titleLower.includes(k))) {
              totalSkipped++;
              console.log(`  🚫 ПРОПУСК (исключающее слово в заголовке): ${title}`);
              continue;
            }
            // Обработка форматирования и краткого превью
            let fullDescriptionContent = undefined as any;
            let processedHtml = undefined as string | undefined;
            if (descriptionHtml) {
              const processed = DescriptionService.processFullDescription(descriptionHtml);
              fullDescriptionContent = processed;
              processedHtml = processed.processed;
            }

            const parsed = {
              externalId: id || `${SOURCE}:${url}`,
              title,
              company,
              location,
              url,
              source: SOURCE,
              publishedAt,
              description: (fullDescriptionContent?.preview) || undefined,
              fullDescription: fullDescriptionContent,
              processedHtml,
              skills: skills, // не подставляем дефолтный javascript, чтобы не размывать фильтр
              salaryFrom,
              salaryTo,
              salaryCurrency,
              rawData: it
            } as const;

            // Дополнительных стоп-слов не применяем — основной фильтр уже по тегам и заголовку

            totalFound++;
            const existing = await Vacancy.findOne({ externalId: parsed.externalId, source: SOURCE });
            if (!existing) {
              await Vacancy.create(parsed);
              totalNew++;
              console.log(`  ✨ НОВАЯ: ${parsed.title}`);
            } else {
              const res = await Vacancy.updateOne({ _id: existing._id }, { ...parsed, updatedAt: new Date() });
              if (res.modifiedCount > 0) {
                totalUpdated++;
                console.log(`  🔄 ОБНОВЛЕНА: ${parsed.title}`);
              } else {
                console.log(`  ⚪ БЕЗ ИЗМЕНЕНИЙ: ${parsed.title}`);
              }
            }
          } catch (err) {
            totalSkipped++;
            console.log(`  ❌ Ошибка элемента, пропущен`);
          }
        }
      } catch (e) {
        console.log(`  ❌ Ошибка JSON списка: ${listJsonUrl}`);
      }

      await sleep(Math.max(REQUEST_DELAY_MS, 300));
    }

    console.log("\n🎯 ИТОГ ПО GEEKJOB:");
    console.log(`📊 Обработано карточек: ${totalFound}`);
    console.log(`✨ Новых: ${totalNew}`);
    console.log(`🔄 Обновлено: ${totalUpdated}`);
    console.log(`❌ Пропущено: ${totalSkipped}`);
  } catch (e) {
    console.error("❌ Ошибка парсинга GeekJob:", e);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

run();


