#!/usr/bin/env node

/**
 * Интерактивный скрипт для генерации Telegram session string
 * Этот скрипт поможет создать TELEGRAM_SESSION_STRING для использования в проекте
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import * as readline from 'readline';
import { validateTelegramConfig } from '../config/telegram.js';

// Интерфейс для работы с readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Функция для получения ввода пользователя
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function generateTelegramSession(): Promise<void> {
  console.log('🔐 Генерация Telegram Session String');
  console.log('='.repeat(50));
  console.log('');

  try {
    // 1. Проверяем конфигурацию
    console.log('📋 Шаг 1: Проверка конфигурации...');
    const configValidation = validateTelegramConfig();

    if (!configValidation.isValid) {
      console.error('❌ Ошибка конфигурации:');
      configValidation.errors.forEach(error => console.error(`  - ${error}`));
      console.log('\n💡 Для исправления:');
      console.log('1. Получите API credentials на https://my.telegram.org/apps');
      console.log('2. Установите переменные окружения:');
      console.log('   export TELEGRAM_API_ID=your_api_id');
      console.log('   export TELEGRAM_API_HASH=your_api_hash');
      rl.close();
      return;
    }

    console.log('✅ Конфигурация корректна');

    // 2. Получаем API credentials
    const apiId = parseInt(process.env.TELEGRAM_API_ID || '');
    const apiHash = process.env.TELEGRAM_API_HASH || '';

    console.log('\n📋 Шаг 2: Инициализация Telegram клиента...');
    console.log(`API ID: ${apiId}`);
    console.log(`API Hash: ${apiHash.substring(0, 8)}...`);

    // 3. Создаем новую сессию
    const stringSession = new StringSession(''); // Пустая сессия для первого входа
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    console.log('\n📋 Шаг 3: Подключение к Telegram...');
    await client.start({
      phoneNumber: async () => {
        const phone = await askQuestion('📱 Введите ваш номер телефона (в формате +7XXXXXXXXXX): ');
        console.log(`Использую номер: ${phone}`);
        return phone;
      },
      password: async () => {
        const password = await askQuestion('🔒 Введите пароль двухфакторной аутентификации (если включена): ');
        return password;
      },
      phoneCode: async () => {
        const code = await askQuestion('📨 Введите код из SMS/Telegram: ');
        return code;
      },
      onError: (err: any) => {
        console.error('❌ Ошибка аутентификации:', err);
        throw err;
      },
    });

    console.log('\n✅ Успешная аутентификация!');

    // 4. Получаем session string
    const sessionString = client.session.save() as unknown as string;
    console.log('\n📋 Шаг 4: Генерация session string...');
    console.log('✅ Session string успешно создан!');

    // 5. Тестируем сессию
    console.log('\n📋 Шаг 5: Тестирование сессии...');
    try {
      const me = await client.getMe();
      console.log(`✅ Сессия работает! Пользователь: @${me.username || 'unknown'} (${me.firstName})`);
    } catch (error) {
      console.warn('⚠️ Предупреждение: не удалось получить информацию о пользователе:', error);
    }

    // 6. Проверяем доступ к каналу
    console.log('\n📋 Шаг 6: Проверка доступа к каналу @vacancy_it_ulbitv...');
    try {
      const channel = await client.getEntity('@vacancy_it_ulbitv');
      if (channel) {
        console.log('✅ Канал @vacancy_it_ulbitv доступен!');

        // Получаем пару сообщений для теста
        const messages = await client.getMessages(channel, { limit: 2 });
        console.log(`📬 Последние сообщения (${messages.length}шт):`);
        messages.forEach((msg: any, i: number) => {
          if (msg && msg.message) {
            const preview = msg.message.substring(0, 80);
            console.log(`  ${i + 1}. "${preview}${msg.message.length > 80 ? '...' : ''}"`);
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Предупреждение: канал @vacancy_it_ulbitv недоступен:', error);
      console.log('💡 Это может быть, если:');
      console.log('  - Канал приватный');
      console.log('  - Вы не подписаны на канал');
      console.log('  - Канал изменил username');
    }

    await client.disconnect();

    // 7. Показываем результат
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! Session string успешно создан!');
    console.log('='.repeat(70));
    console.log('\n📋 ВАЖНО: Сохраните этот session string в переменную окружения:\n');
    console.log('export TELEGRAM_SESSION_STRING="' + sessionString + '"');
    console.log('\n💡 Или добавьте в файл .env:');
    console.log('TELEGRAM_SESSION_STRING="' + sessionString + '"');

    console.log('\n📋 После установки переменной окружения, вы сможете запустить:');
    console.log('npm run test:telegram:real');
    console.log('');
    console.log('🔒 БЕЗОПАСНОСТЬ: Никому не передавайте session string!');
    console.log('   Это равносильно передаче доступа к вашему Telegram аккаунту.');

  } catch (error) {
    console.error('\n💥 Ошибка генерации сессии:', error);
    if (error instanceof Error) {
      console.error('Подробности:', error.message);
    }
  } finally {
    rl.close();
  }
}

// Запуск скрипта, если он выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTelegramSession()
    .then(() => {
      console.log('\n🏁 Генерация сессии завершена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Ошибка:', error);
      process.exit(1);
    });
}

export { generateTelegramSession }; 