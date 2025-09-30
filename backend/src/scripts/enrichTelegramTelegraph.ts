import dotenv from 'dotenv';
dotenv.config();

import mongoose from '../config/database.js';
import ky from 'ky';
import * as cheerio from 'cheerio';

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
          textOnly: { type: String }
        },
        default: undefined
      },
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

      visited: { type: Boolean, default: false },
      rawData: { type: mongoose.Schema.Types.Mixed },
    },
    {
      timestamps: true,
      versionKey: false,
      collection: 'vacancies',
    }
  );

  vacancySchema.index({ publishedAt: -1 });
  return mongoose.model('Vacancy', vacancySchema);
}

function makePreview(text: string, limit = 500): string {
  const norm = (text || '').replace(/\s+/g, ' ').trim();
  if (norm.length <= limit) return norm;
  const slice = norm.slice(0, limit);
  const last = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  return (last > 100 ? slice.slice(0, last + 1) : slice) + '…';
}

function extractFirstParagraph(htmlOrText: string): string {
  if (!htmlOrText) return '';

  // Если это HTML, извлекаем первый параграф
  if (htmlOrText.includes('<')) {
    try {
      const $ = cheerio.load(htmlOrText);
      const firstP = $('p').first();
      if (firstP.length > 0) {
        const text = firstP.text().trim();
        if (text) return text;
      }
    } catch (e) {
      console.warn('Failed to parse HTML for first paragraph:', e);
    }
  }

  // Fallback: берем первые 2-3 предложения из текста
  const sentences = htmlOrText.replace(/<[^>]*>/g, '').split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim();
    if (firstSentence.length > 20) {
      return firstSentence + (sentences[0].includes('.') ? '' : '.');
    }
    // Если первое предложение короткое, берем первые два
    if (sentences.length > 1) {
      return (firstSentence + ' ' + sentences[1]).trim() + '.';
    }
  }

  // Последний fallback: обрезаем до 200 символов
  return makePreview(htmlOrText.replace(/<[^>]*>/g, ''), 200);
}

async function fetchTelegraph(url: string): Promise<{ raw: string; text: string } | null> {
  try {
    if (!/telegra\.ph|telegraph\.ph|te\.legra\.ph/i.test(url)) return null;
    const html = await ky.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent': 'JS-Pulse/1.0 (+https://jspulse.ru) NodeFetch',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.8'
      }
    }).text();
    const $ = cheerio.load(html);

    // Telegraph использует #_tl_editor как основной контейнер
    let content = $('#_tl_editor').first();
    if (content.length === 0) {
      content = $('.tl_article_content').first();
    }
    if (content.length === 0) {
      content = $('article').first();
    }
    if (content.length === 0) return null;

    // Клонируем контент и удаляем первый h1 (дублированный заголовок)
    const contentClone = content.clone();
    contentClone.find('h1').first().remove();

    // Убираем пустые элементы и заменяем пустые параграфы с <br> на один <br>
    contentClone.find('address').remove();
    contentClone.find('p').each((_, el) => {
      const $el = $(el);
      if ($el.text().trim() === '') {
        if ($el.html() === '<br>' || $el.html() === '<br></br>') {
          // Заменяем пустой параграф с <br> на один <br>
          $el.replaceWith('<br>');
        } else {
          // Удаляем полностью пустые параграфы
          $el.remove();
        }
      }
    });

    const raw = contentClone.html() || '';
    const text = contentClone.text() || '';
    return { raw, text };
  } catch (e) {
    console.warn('Telegraph fetch failed:', url, e instanceof Error ? e.message : e);
    return null;
  }
}

async function main() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://mongodb:27017/jspulse';
  await mongoose.connect(mongoUrl);
  const Vacancy = await getVacancyModel();

  const cursor = Vacancy.find({ source: 'telegram', sourceUrl: { $exists: true, $ne: null } }).cursor();
  let processed = 0, updated = 0, skipped = 0;

  for await (const doc of cursor as any) {
    processed++;
    const id = doc._id.toString();
    const srcUrl: string | undefined = doc.sourceUrl;

    if (!srcUrl) { skipped++; continue; }

    const tele = await fetchTelegraph(srcUrl);
    if (!tele || !tele.raw) { skipped++; continue; }

    // Извлекаем первый параграф как краткое описание
    const preview = extractFirstParagraph(tele.raw);

    const res = await Vacancy.updateOne({ _id: id }, {
      description: preview,
      fullDescription: {
        raw: tele.raw,
        preview,
        processed: tele.raw,
        textOnly: tele.text || ''
      },
      updatedAt: new Date()
    });

    if (res.modifiedCount > 0) updated++;
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`Enrichment done. Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('❌ Enrichment failed:', e);
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});
