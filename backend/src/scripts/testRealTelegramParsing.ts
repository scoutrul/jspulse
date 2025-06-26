/**
 * Тестовый скрипт для реального парсинга Telegram каналов
 * Подключается к Telegram API и обрабатывает живые сообщения из доступных каналов
 */

import { TelegramClient } from '../services/telegram/TelegramClient.js';
import { MessageProcessor } from '../services/telegram/MessageProcessor.js';
import { SessionManager } from '../services/telegram/SessionManager.js';
import { validateTelegramConfig, logTelegramConfig, TELEGRAM_CONFIG } from '../config/telegram.js';

async function testRealTelegramParsing(): Promise<void> {
  console.log('🚀 Starting REAL Telegram parsing test for multiple channels...\n');

  try {
    // 1. Проверяем конфигурацию
    console.log('📋 Step 1: Validating Telegram configuration...');
    const configValidation = validateTelegramConfig();

    if (!configValidation.isValid) {
      console.error('❌ Configuration validation failed:');
      configValidation.errors.forEach(error => console.error(`  - ${error}`));
      console.log('\n💡 To fix this, you need to:');
      console.log('1. Get Telegram API credentials from https://my.telegram.org/apps');
      console.log('2. Set environment variables:');
      console.log('   export TELEGRAM_API_ID=your_api_id');
      console.log('   export TELEGRAM_API_HASH=your_api_hash');
      console.log('3. Run this script again to generate session string');
      return;
    }

    console.log('✅ Configuration is valid');
    logTelegramConfig();
    console.log('');

    // 2. Проверяем наличие session string
    console.log('📋 Step 2: Checking session availability...');
    const sessionManager = new SessionManager();
    const sessionInfo = await sessionManager.getSessionInfo();

    if (!sessionInfo.valid) {
      console.error('❌ Invalid or missing session string');
      console.log('💡 You need to generate a session string first.');
      console.log('Run: npm run telegram:generate-session');
      return;
    }

    console.log('✅ Session is valid');
    console.log(`📅 Session last used: ${sessionInfo.lastUsed?.toLocaleString()}`);

    // 3. Создаем клиенты и процессор
    console.log('\n📋 Step 3: Creating Telegram client and message processor...');
    const telegramClient = new TelegramClient();
    const messageProcessor = new MessageProcessor();
    console.log('✅ Components initialized');

    // 4. Подключаемся к Telegram
    console.log('\n📋 Step 4: Connecting to Telegram...');

    try {
      await telegramClient.connect();
      console.log('✅ Successfully connected to Telegram!');

      // 5. Проверяем доступность каналов
      console.log('\n📋 Step 5: Checking channels accessibility...');

      const channels = TELEGRAM_CONFIG.CHANNELS;
      const accessibleChannels: string[] = [];

      for (const channelUsername of channels) {
        console.log(`📡 Checking channel: ${channelUsername}`);

        try {
          const isAccessible = await telegramClient.isChannelAccessible(channelUsername);

          if (isAccessible) {
            console.log(`✅ Channel ${channelUsername} is accessible`);
            accessibleChannels.push(channelUsername);
          } else {
            console.log(`❌ Channel ${channelUsername} is not accessible`);
            console.log(`💡 This could happen if:`);
            console.log(`  - The channel is private and you're not subscribed`);
            console.log(`  - The channel username is incorrect`);
            console.log(`  - You don't have permissions to access this channel`);
          }
        } catch (error) {
          console.log(`❌ Error checking channel ${channelUsername}:`, error instanceof Error ? error.message : error);
        }

        console.log(''); // Separator
      }

      if (accessibleChannels.length === 0) {
        console.error('❌ No accessible channels found!');
        console.log('\n💡 Suggestions:');
        console.log('1. Subscribe to the channels manually in Telegram app first');
        console.log('2. Check if channel usernames are correct');
        console.log('3. Update TELEGRAM_CHANNELS environment variable with accessible channels');
        await telegramClient.disconnect();
        return;
      }

      console.log(`🎉 Found ${accessibleChannels.length} accessible channels: ${accessibleChannels.join(', ')}`);

      // 6. Парсим сообщения из доступных каналов
      console.log('\n📋 Step 6: Processing messages from accessible channels...');

      let totalResults: any[] = [];

      for (const channelUsername of accessibleChannels) {
        console.log(`\n🔍 Processing channel: ${channelUsername}`);
        console.log('='.repeat(80));

        try {
          // Получаем информацию о канале
          const channelInfo = await telegramClient.getChannelInfo(channelUsername);
          if (channelInfo) {
            console.log('📊 Channel Info:');
            console.log(`  - Title: ${channelInfo.title}`);
            console.log(`  - Username: ${channelInfo.username}`);
            console.log(`  - Members: ${channelInfo.membersCount || 'Unknown'}`);
            console.log(`  - Active: ${channelInfo.isActive}`);
          }

          // Получаем последние сообщения  
          const messages = await telegramClient.getChannelMessages(channelUsername, 5); // 5 сообщений с каждого канала
          console.log(`📬 Retrieved ${messages.length} messages from ${channelUsername}`);

          if (messages.length === 0) {
            console.log('⚠️ No messages found in this channel');
            continue;
          }

          // Обрабатываем сообщения
          const results = await messageProcessor.processMessages(messages);
          const validCount = results.filter(r => r.valid).length;

          console.log(`📊 Channel ${channelUsername} Results:`);
          console.log(`  📝 Total messages: ${results.length}`);
          console.log(`  ✅ Valid vacancies: ${validCount}`);
          console.log(`  📈 Success rate: ${(validCount / results.length * 100).toFixed(1)}%`);

          // Добавляем детальный лог первых 2 валидных результатов
          const validResults = results.filter(r => r.valid);
          if (validResults.length > 0) {
            console.log(`\n📋 Detailed Results (first ${Math.min(2, validResults.length)} valid vacancies):`);

            for (let i = 0; i < Math.min(2, validResults.length); i++) {
              const result = validResults[i];
              const data = result.extractedData;

              console.log(`\n🔍 Vacancy #${i + 1} (Message ID: ${result.message.id}):`);
              console.log(`  📋 Title: ${data.title || 'Not found'}`);
              console.log(`  🏢 Company: ${data.company || 'Not found'}`);
              console.log(`  💰 Salary: ${data.salary ? `${data.salary.from || '?'}-${data.salary.to || '?'} ${data.salary.currency || '?'}` : 'Not found'}`);
              console.log(`  📍 Location: ${data.location || 'Not found'}`);
              console.log(`  🛠️ Skills: ${(data.skills && data.skills.length > 0) ? data.skills.join(', ') : 'Not found'}`);
              console.log(`  👤 Contact: ${data.contact || 'Not found'}`);
              console.log(`  📊 Confidence: ${(data.confidence * 100).toFixed(1)}%`);

              // Добавляем новые поля если есть
              if ((data as any).format) console.log(`  💼 Format: ${(data as any).format}`);
              if ((data as any).employment) console.log(`  ⏰ Employment: ${(data as any).employment}`);
              if ((data as any).descriptionUrl) console.log(`  🔗 Description URL: ${(data as any).descriptionUrl}`);
              if ((data as any).hashtags && (data as any).hashtags.length > 0) {
                console.log(`  🏷️ Hashtags: ${(data as any).hashtags.join(', ')}`);
              }
              if ((data as any).fullDescription) {
                const preview = (data as any).fullDescription.substring(0, 100);
                console.log(`  📄 Full Description: ${preview}${(data as any).fullDescription.length > 100 ? '...' : ''}`);
              }

              // Краткий превью сообщения
              const messagePreview = result.message.text.substring(0, 200);
              console.log(`  📝 Message Preview: "${messagePreview}${result.message.text.length > 200 ? '...' : ''}"`);
            }
          }

          totalResults = [...totalResults, ...results];

        } catch (channelError) {
          console.error(`❌ Error processing channel ${channelUsername}:`, channelError);
        }

        console.log(''); // Separator between channels
      }

      // 7. Общая статистика по всем каналам
      console.log('='.repeat(80));
      console.log('\n📈 FINAL STATISTICS FOR ALL CHANNELS:');

      const totalValidCount = totalResults.filter(r => r.valid).length;
      const averageConfidence = totalResults.length > 0
        ? totalResults.reduce((sum, r) => sum + r.extractedData.confidence, 0) / totalResults.length
        : 0;

      console.log(`📊 Total channels checked: ${channels.length}`);
      console.log(`✅ Accessible channels: ${accessibleChannels.length}`);
      console.log(`📝 Total messages processed: ${totalResults.length}`);
      console.log(`✅ Total valid vacancies found: ${totalValidCount} (${totalResults.length > 0 ? (totalValidCount / totalResults.length * 100).toFixed(1) : 0}%)`);
      console.log(`📏 Average confidence: ${(averageConfidence * 100).toFixed(1)}%`);

      // Confidence breakdown
      if (totalResults.length > 0) {
        const highConfidence = totalResults.filter(r => r.extractedData.confidence >= 0.8).length;
        const mediumConfidence = totalResults.filter(r => r.extractedData.confidence >= 0.5 && r.extractedData.confidence < 0.8).length;
        const lowConfidence = totalResults.filter(r => r.extractedData.confidence >= 0.3 && r.extractedData.confidence < 0.5).length;

        console.log('\n🎯 Overall Confidence Breakdown:');
        console.log(`  🔥 High (80-100%): ${highConfidence} messages`);
        console.log(`  🟡 Medium (50-79%): ${mediumConfidence} messages`);
        console.log(`  🟠 Low (30-49%): ${lowConfidence} messages`);
        console.log(`  ❌ Invalid (<30%): ${totalResults.length - highConfidence - mediumConfidence - lowConfidence} messages`);
      }

      await telegramClient.disconnect();
      console.log('\n✅ Multi-channel Telegram parsing test completed successfully!');

    } catch (connectionError) {
      console.error('❌ Failed to connect to Telegram:', connectionError);
      console.log('\n💡 Common issues and solutions:');
      console.log('1. **Missing session string**: Set TELEGRAM_SESSION_STRING environment variable');
      console.log('2. **Invalid API credentials**: Check TELEGRAM_API_ID and TELEGRAM_API_HASH');
      console.log('3. **Network issues**: Check internet connection');
      console.log('4. **Rate limiting**: Wait a few minutes and try again');

      if (connectionError instanceof Error && connectionError.message.includes('session')) {
        console.log('\n🔧 Session generation needed. This requires interactive authentication.');
        console.log('For security reasons, this should be done manually.');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 If the issue persists:');
    console.log('1. Check that all environment variables are set correctly');
    console.log('2. Verify that Telegram session is valid');
    console.log('3. Make sure you have access to the specified channels');
    console.log('4. Try regenerating the session string');
  }
}

export { testRealTelegramParsing };

// Запуск теста, если скрипт выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealTelegramParsing()
    .then(() => {
      console.log('\n🏁 Multi-channel Telegram test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
} 