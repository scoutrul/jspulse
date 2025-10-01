import mongoose from 'mongoose';
import { EarlyExitStrategy } from './dist/utils/parsing/earlyExitStrategy.js';

async function parseCareeredAPI() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/jspulse';
  await mongoose.connect(mongoUrl);
  const db = mongoose.connection.db;
  const collection = db.collection('vacancies');

  // Функция обработки отдельной вакансии
  async function processVacancy(entry) {
    try {
      console.log(`🔍 Парсинг: ${entry.features.find(f => f.key === 'name')?.value || 'Unknown'}`);

      // Получаем детали вакансии
      const detailResponse = await fetch(`https://careered.io/api/jobs/${entry.id}`);
      const detailData = await detailResponse.json();

      // Извлекаем данные из features
      const features = {};
      detailData.features.forEach(f => {
        features[f.key] = f.value;
      });

      const title = features.name || 'Без названия';
      const company = features.company || 'Неизвестная компания';
      const location = features.location || 'Неизвестное местоположение';
      const summary = features.summary || '';
      const content = detailData.content || '';
      const descriptionFull = content || summary || '';
      const preview = (features.summary || descriptionFull).slice(0, 500);

      // Доп. поля
      const experience = features.yoe ? String(features.yoe) : undefined;
      const employment = features.term ? String(features.term) : undefined; // fulltime/parttime/contract
      const salaryFrom = features.salary_from ? parseInt(features.salary_from) : undefined;
      const salaryTo = features.salary_to ? parseInt(features.salary_to) : undefined;
      const salaryCurrency = features.salary_currency || undefined;
      const salaryPeriod = features.salary_period || undefined; // month/hour
      const logoUrl = features.photo ? String(features.photo) : undefined;
      const tag = features.tag ? String(features.tag) : (detailData.tag?.name || undefined);
      const isBoosted = features.is_boosted === 'true';
      const isCrypto = features.crypto === 'true';
      const contact = (detailData.links || []).find(l => l.key === 'telegram' || l.key === 'mail')?.value || undefined;

      // Дата публикации
      const postedAt = new Date(detailData.posted_at * 1000);

      const doc = {
        externalId: `careered:${entry.id}`,
        title,
        company,
        location,
        url: `https://careered.io/jobs/${entry.id}`,
        publishedAt: postedAt,
        source: 'careered',
        description: preview,
        fullDescription: {
          raw: descriptionFull,
          preview,
          processed: descriptionFull,
          textOnly: descriptionFull
        },
        skills: [],
        salaryFrom,
        salaryTo,
        salaryCurrency,
        salaryPeriod,
        experience,
        employment,
        logoUrl,
        contact,
        hashtags: tag ? [tag] : [],
        isHighSalary: false,
        isRemote: location.toLowerCase().includes('remote') || location.toLowerCase().includes('удаленн'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Сохраняем в базу
      await collection.updateOne(
        { externalId: doc.externalId, source: 'careered' },
        { $set: doc },
        { upsert: true }
      );

      console.log(`✅ Сохранена: ${title} (${company})`);

      // Небольшая пауза между запросами
      await new Promise(r => setTimeout(r, 80));

    } catch (error) {
      console.error(`❌ Ошибка парсинга ${entry.id}:`, error.message);
      throw error;
    }
  }

  try {
    console.log('🔍 Загружаю список вакансий из API...');

    const limit = Number(process.env.CAREERED_LIMIT || 100);
    let offset = 0;
    let total = 0;

    let saved = 0;
    let skipped = 0;

    while (true) {
      // Получаем страницу списка вакансий
      const url = `https://careered.io/api/jobs?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa&limit=${limit}&offset=${offset}`;
      const listResponse = await fetch(url);
      const listData = await listResponse.json();

      if (!Array.isArray(listData.entries) || listData.entries.length === 0) {
        console.log(`📭 Пустая страница (offset=${offset}). Останавливаюсь.`);
        break;
      }

      total = listData.total ?? (offset + listData.entries.length);
      console.log(`📄 Страница: offset=${offset}, получено=${listData.entries.length}, всего=${total}`);

      // Используем стратегию раннего выхода для обработки вакансий на странице
      const result = await EarlyExitStrategy.processPage(
        listData.entries,
        // Функция проверки существования вакансии
        async (entry) => {
          const existing = await collection.findOne({
            externalId: `careered:${entry.id}`,
            source: 'careered'
          });
          return !!existing;
        },
        // Функция обработки новой вакансии
        async (entry) => {
          await processVacancy(entry);
        },
        {
          minNewItems: 1, // Минимум 1 новая вакансия для продолжения
          maxExistingRatio: 1.0, // Максимум 100% существующих вакансий
          verbose: true
        }
      );

      saved += result.newCount;
      skipped += result.totalCount - result.newCount - result.existingCount;

      console.log(`📄 Страница: ✨${result.newCount} новых, 🔄${result.existingCount} обновлено, ❌${result.totalCount - result.newCount - result.existingCount} пропущено`);

      // Если все вакансии на странице уже существуют, прекращаем парсинг
      if (!result.shouldContinue) {
        console.log(`🛑 Остановка парсинга: ${result.stopReason}`);
        break;
      }

      // Следующая страница
      offset += limit;
    }

    console.log(`\n🎯 ИТОГ:`);
    console.log(`✅ Сохранено: ${saved}`);
    console.log(`❌ Пропущено: ${skipped}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await mongoose.disconnect();
  }
}

parseCareeredAPI();
