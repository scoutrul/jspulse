import { config } from 'dotenv';
import { connectDB } from '../config/database.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { TelegramParserService } from '../services/TelegramParserService.js';

// Загружаем переменные окружения
config();

/**
 * Тестирование TelegramParserService с сохранением в базу данных
 */
async function testTelegramParserService(): Promise<void> {
  console.log('🚀 Starting TelegramParserService test with database integration...');

  try {
    // 1. Подключаемся к базе данных
    console.log('\n📋 Step 1: Connecting to database...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // 2. Создаем репозиторий и сервис
    console.log('\n📋 Step 2: Initializing services...');
    const vacancyRepository = new VacancyRepository();
    const telegramParserService = new TelegramParserService(vacancyRepository);
    console.log('✅ Services initialized');

    // 3. Получаем статистику до парсинга
    console.log('\n📋 Step 3: Getting statistics before parsing...');
    const statsBefore = await telegramParserService.getParsingStats();
    console.log('📊 Statistics before parsing:');
    console.log(`  📝 Total vacancies: ${statsBefore.totalVacancies}`);
    console.log(`  🤖 Telegram vacancies: ${statsBefore.telegramVacancies}`);
    console.log('  📊 Channel breakdown:');
    statsBefore.channelBreakdown.forEach(channel => {
      console.log(`    - ${channel.channel}: ${channel.count} vacancies`);
    });

    // 4. Запускаем парсинг
    console.log('\n📋 Step 4: Running Telegram parsing...');
    const parseResults = await telegramParserService.parseAllChannels();

    // 5. Выводим результаты парсинга
    console.log('\n📊 PARSING RESULTS:');
    console.log(`📝 Total messages processed: ${parseResults.totalProcessed}`);
    console.log(`💾 Total vacancies saved: ${parseResults.totalSaved}`);
    console.log(`📈 Success rate: ${parseResults.totalProcessed > 0 ? (parseResults.totalSaved / parseResults.totalProcessed * 100).toFixed(1) : 0}%`);

    // Детали по каналам
    console.log('\n📋 Channel-by-channel results:');
    parseResults.channels.forEach(channel => {
      console.log(`\n🔍 Channel: ${channel.channel}`);
      console.log(`  📝 Processed: ${channel.processed} messages`);
      console.log(`  💾 Saved: ${channel.saved} vacancies`);
      if (channel.errors.length > 0) {
        console.log(`  ❌ Errors: ${channel.errors.length}`);
        channel.errors.forEach((error, index) => {
          console.log(`    ${index + 1}. ${error}`);
        });
      }
    });

    // 6. Получаем статистику после парсинга
    console.log('\n📋 Step 6: Getting statistics after parsing...');
    const statsAfter = await telegramParserService.getParsingStats();
    console.log('\n📊 Statistics after parsing:');
    console.log(`  📝 Total vacancies: ${statsAfter.totalVacancies}`);
    console.log(`  🤖 Telegram vacancies: ${statsAfter.telegramVacancies}`);
    console.log('  📊 Channel breakdown:');
    statsAfter.channelBreakdown.forEach(channel => {
      console.log(`    - ${channel.channel}: ${channel.count} vacancies`);
    });

    // 7. Сравниваем результаты
    console.log('\n📈 COMPARISON:');
    const totalDiff = statsAfter.totalVacancies - statsBefore.totalVacancies;
    const telegramDiff = statsAfter.telegramVacancies - statsBefore.telegramVacancies;
    console.log(`  📝 Total vacancies change: +${totalDiff}`);
    console.log(`  🤖 Telegram vacancies change: +${telegramDiff}`);

    // 8. Показываем последние добавленные вакансии
    console.log('\n📋 Step 8: Showing latest added vacancies...');
    const latestVacancies = await vacancyRepository.findMany({
      where: { source: 'telegram' },
      limit: 3
    });

    if (latestVacancies.data.length > 0) {
      console.log('\n🆕 Latest added Telegram vacancies:');
      latestVacancies.data.forEach((vacancy, index) => {
        console.log(`\n${index + 1}. 📋 ${vacancy.title}`);
        console.log(`   🏢 Company: ${vacancy.company}`);
        console.log(`   💰 Salary: ${vacancy.salaryFrom || '?'}-${vacancy.salaryTo || '?'} ${vacancy.salaryCurrency || 'RUB'}`);
        console.log(`   📍 Location: ${vacancy.location}`);
        console.log(`   🛠️ Skills: ${vacancy.skills.join(', ') || 'None'}`);
        console.log(`   📺 Channel: ${vacancy.sourceChannel || 'Unknown'}`);
        console.log(`   👤 Contact: ${vacancy.contact || 'None'}`);
        console.log(`   📊 Confidence: ${vacancy.confidence ? (vacancy.confidence * 100).toFixed(1) + '%' : 'Unknown'}`);
        console.log(`   🕐 Parsed at: ${vacancy.parsedAt ? vacancy.parsedAt.toLocaleString() : 'Unknown'}`);
      });
    } else {
      console.log('⚠️ No Telegram vacancies found in database');
    }

    console.log('\n✅ TelegramParserService test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Закрываем подключение к базе данных
    process.exit(0);
  }
}

// Запуск теста, если скрипт выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  testTelegramParserService()
    .then(() => {
      console.log('\n🏁 TelegramParserService test completed');
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
} 