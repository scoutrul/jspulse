/**
 * Тестовый скрипт для проверки подключения к Telegram API
 * Использует SessionManager и TelegramClient для тестирования базовой функциональности
 */

import { TelegramClient } from '../services/telegram/TelegramClient.js';
import { SessionManager } from '../services/telegram/SessionManager.js';
import { validateTelegramConfig, logTelegramConfig } from '../config/telegram.js';

async function testTelegramConnection(): Promise<void> {
  console.log('🧪 Starting Telegram connection test...\n');

  try {
    // 1. Проверяем конфигурацию
    console.log('📋 Step 1: Validating configuration...');
    const configValidation = validateTelegramConfig();

    if (!configValidation.isValid) {
      console.error('❌ Configuration validation failed:');
      configValidation.errors.forEach(error => console.error(`  - ${error}`));
      return;
    }

    console.log('✅ Configuration is valid');
    logTelegramConfig();
    console.log('');

    // 2. Проверяем SessionManager
    console.log('📋 Step 2: Testing SessionManager...');
    const sessionManager = new SessionManager();
    const sessionInfo = await sessionManager.getSessionInfo();

    console.log('📊 Session Info:');
    console.log(`  - Exists: ${sessionInfo.exists}`);
    console.log(`  - Valid: ${sessionInfo.valid}`);
    console.log(`  - User ID: ${sessionInfo.userId || 'N/A'}`);
    console.log(`  - Username: ${sessionInfo.username || 'N/A'}`);
    console.log(`  - Last Used: ${sessionInfo.lastUsed || 'N/A'}`);
    console.log('');

    // 3. Тестируем TelegramClient (без реального подключения)
    console.log('📋 Step 3: Testing TelegramClient initialization...');
    const telegramClient = new TelegramClient();
    const connectionStatus = telegramClient.getConnectionStatus();

    console.log('📊 Connection Status:');
    console.log(`  - Connected: ${connectionStatus.connected}`);
    console.log(`  - Session Valid: ${connectionStatus.sessionValid}`);
    console.log('');

    // 4. Проверяем наличие session string
    console.log('📋 Step 4: Checking session string availability...');
    const sessionString = await sessionManager.getSessionString();

    if (sessionString) {
      console.log('✅ Session string is available');
      console.log(`  - Length: ${sessionString.length} characters`);
      console.log(`  - Starts with: ${sessionString.substring(0, 10)}...`);
    } else {
      console.log('⚠️ No session string found');
      console.log('💡 To connect to Telegram, you need to:');
      console.log('   1. Set TELEGRAM_API_ID and TELEGRAM_API_HASH in environment');
      console.log('   2. Generate session string using authentication flow');
      console.log('   3. Set TELEGRAM_SESSION_STRING in environment or use file storage');
    }
    console.log('');

    console.log('✅ Basic Telegram integration test completed successfully!');
    console.log('🚀 Ready for Phase 1 implementation');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Запуск теста, если скрипт выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  testTelegramConnection()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testTelegramConnection }; 