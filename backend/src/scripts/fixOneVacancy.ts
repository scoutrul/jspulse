import dotenv from 'dotenv';
import mongoose from '../config/database.js';
import ky from 'ky';
import * as cheerio from 'cheerio';

dotenv.config();

async function getVacancyModel() {
  const vacancySchema = new mongoose.Schema({}, { strict: false, collection: 'vacancies' });
  return mongoose.model('Vacancy', vacancySchema);
}

async function fetchTelegraphBody(url: string): Promise<{ raw: string; text: string } | null> {
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

    // Отладочная информация
    console.log('HTML length:', html.length);
    console.log('.ql-editor count:', $('.ql-editor').length);
    console.log('article count:', $('article').length);
    console.log('#_tl_editor count:', $('#_tl_editor').length);
    console.log('.tl_article_content count:', $('.tl_article_content').length);

    // Telegraph использует #_tl_editor как основной контейнер
    let content = $('#_tl_editor').first();
    if (content.length === 0) {
      content = $('.tl_article_content').first();
    }
    if (content.length === 0) {
      content = $('article').first();
    }

    console.log('Found content length:', content.length);
    if (!content || content.length === 0) {
      console.log('Available classes:', $('*').map((_, el) => $(el).attr('class')).get().filter(Boolean).slice(0, 10));
      return null;
    }
    const clone = content.clone();
    clone.find('h1').first().remove();
    const raw = clone.html() || '';
    const text = clone.text() || '';
    return { raw, text };
  } catch (e) {
    console.error('fetchTelegraphBody failed:', e);
    return null;
  }
}

function makePreview(text: string, limit = 500): string {
  const norm = (text || '').replace(/\s+/g, ' ').trim();
  if (norm.length <= limit) return norm;
  const slice = norm.slice(0, limit);
  const last = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  return (last > 100 ? slice.slice(0, last + 1) : slice) + '…';
}

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: tsx src/scripts/fixOneVacancy.ts <vacancyId>');
    process.exit(1);
  }

  const mongoUrl = process.env.MONGO_URI || 'mongodb://mongodb:27017/jspulse';
  await mongoose.connect(mongoUrl);
  const Vacancy = await getVacancyModel();

  const doc = await Vacancy.findOne({ _id: id });
  if (!doc) {
    console.error('Vacancy not found:', id);
    await mongoose.disconnect();
    process.exit(1);
  }

  const sourceUrl: string | undefined = (doc as any).sourceUrl;
  if (!sourceUrl) {
    console.error('Vacancy has no sourceUrl:', id);
    await mongoose.disconnect();
    process.exit(1);
  }

  const tele = await fetchTelegraphBody(sourceUrl);
  if (!tele) {
    console.error('Telegraph content not found for:', sourceUrl);
    await mongoose.disconnect();
    process.exit(1);
  }

  const preview = makePreview(tele.text, 500);

  await Vacancy.updateOne({ _id: id }, {
    description: preview,
    fullDescription: {
      raw: tele.raw,
      preview,
      processed: tele.raw,
      textOnly: tele.text
    },
    updatedAt: new Date()
  });

  console.log('Updated vacancy:', id);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('fixOneVacancy failed:', e);
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});
