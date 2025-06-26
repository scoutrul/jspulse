/**
 * Диагностический скрипт для проверки доступности конкретного канала
 * Специально для решения проблем с @vacancy_it_ulbitv
 */

import { TelegramClient } from '../services/telegram/TelegramClient.js';
import { SessionManager } from '../services/telegram/SessionManager.js';
import { validateTelegramConfig, logTelegramConfig } from '../config/telegram.js';

async function diagnosticChannel(channelUsername: string = '@vacancy_it_ulbitv'): Promise<void> {
  console.log(`🔍 ДИАГНОСТИКА КАНАЛА: ${channelUsername}`);
  console.log('=' + '='.repeat(50));

  try {
    // 1. Проверяем базовую конфигурацию
    console.log('\n📋 Шаг 1: Проверка конфигурации...');
    const configValidation = validateTelegramConfig();

    if (!configValidation.isValid) {
      console.error('❌ Конфигурация некорректна:', configValidation.errors);
      return;
    }

    console.log('✅ Конфигурация корректна');
    logTelegramConfig();

    // 2. Проверяем сессию
    console.log('\n📋 Шаг 2: Проверка сессии...');
    const sessionManager = new SessionManager();
    const sessionInfo = await sessionManager.getSessionInfo();

    if (!sessionInfo.valid) {
      console.error('❌ Сессия недействительна');
      console.log('💡 Запустите: npm run telegram:auth');
      return;
    }

    console.log('✅ Сессия действительна');

    // 3. Создаем клиент и подключаемся
    console.log('\n📋 Шаг 3: Подключение к Telegram...');
    const telegramClient = new TelegramClient();

    try {
      await telegramClient.connect();
      console.log('✅ Подключение к Telegram успешно');

      // 4. Подробная диагностика канала
      console.log(`\n📋 Шаг 4: Подробная диагностика канала ${channelUsername}...`);

      // 4.1. Попытка получить entity канала разными способами
      console.log('\n🔍 4.1. Попытка прямого доступа к каналу...');

      try {
        const entity = await telegramClient.getChannelInfo(channelUsername);

        if (entity) {
          console.log('🎉 КАНАЛ ДОСТУПЕН!');
          console.log('📊 Информация о канале:');
          console.log(`  - ID: ${entity.id}`);
          console.log(`  - Название: ${entity.title}`);
          console.log(`  - Username: ${entity.username}`);
          console.log(`  - Участники: ${entity.membersCount || 'Неизвестно'}`);
          console.log(`  - Активен: ${entity.isActive}`);

          // Пробуем получить сообщения
          console.log('\n🔍 4.2. Попытка получения сообщений...');
          try {
            const messages = await telegramClient.getChannelMessages(channelUsername, 3);
            console.log(`✅ Получено ${messages.length} сообщений из канала`);

            if (messages.length > 0) {
              console.log('\n📝 Примеры сообщений:');
              messages.slice(0, 2).forEach((msg, i) => {
                const preview = msg.text.substring(0, 100);
                console.log(`  ${i + 1}. "${preview}${msg.text.length > 100 ? '...' : ''}"`);
              });

              console.log('\n🎯 РЕЗУЛЬТАТ: Канал полностью доступен для парсинга!');
            } else {
              console.log('⚠️ Канал доступен, но сообщений не найдено');
            }

          } catch (messageError) {
            console.error('❌ Ошибка получения сообщений:', messageError);
            console.log('💡 Возможные причины:');
            console.log('  - Нет прав на чтение истории сообщений');
            console.log('  - Канал пустой');
            console.log('  - Ограничения по времени');
          }

        } else {
          console.log('❌ Не удалось получить информацию о канале');

          // Попробуем альтернативные методы доступа
          console.log('\n🔍 4.2. Попытка альтернативных методов доступа...');

          // Метод 1: Попробуем поиск канала
          console.log('🔍 Метод 1: Поиск канала через resolve...');
          try {
            // Прямой вызов клиента для получения entity
            const client = telegramClient['client']; // Получаем доступ к внутреннему MTProto клиенту
            if (client) {
              console.log('📱 Используем прямой MTProto клиент...');

              // Попробуем resolve username
              const result = await client.invoke(new (await import('telegram/tl/api.js')).Api.contacts.ResolveUsername({
                username: channelUsername.replace('@', '')
              }));

              if (result && result.chats && result.chats.length > 0) {
                const chat = result.chats[0];
                console.log('✅ Канал найден через resolve!');
                console.log(`  - ID: ${chat.id}`);
                console.log(`  - Название: ${(chat as any).title || 'Unknown'}`);
                console.log(`  - Тип: ${chat.className}`);

                // Попробуем получить сообщения через найденный chat
                try {
                  const messages = await client.getMessages(chat, { limit: 3 });
                  console.log(`✅ Получено ${messages.length} сообщений через resolve метод!`);

                  if (messages.length > 0) {
                    console.log('\n📝 Примеры сообщений:');
                    messages.slice(0, 2).forEach((msg: any, i: number) => {
                      if (msg && msg.message) {
                        const preview = msg.message.substring(0, 100);
                        console.log(`  ${i + 1}. "${preview}${msg.message.length > 100 ? '...' : ''}"`);
                      }
                    });

                    console.log('\n🎉 УСПЕХ! Канал @vacancy_it_ulbitv доступен через resolve метод!');
                    console.log('💡 Проблема была в методе getChannelInfo, но канал парсится!');
                  }
                } catch (msgError) {
                  console.log('❌ Ошибка получения сообщений через resolve:', msgError);
                }
              }
            }
          } catch (resolveError) {
            console.log('❌ Resolve метод не сработал:', resolveError);
          }

          // Метод 2: Попробуем через ID если известен
          console.log('\n🔍 Метод 2: Попытка доступа через getDialogs...');
          try {
            const client = telegramClient['client'];
            if (client) {
              const dialogs = await client.getDialogs({ limit: 100 });

              console.log(`📱 Проверяем среди ${dialogs.length} диалогов...`);

              for (const dialog of dialogs) {
                if (dialog.entity && (dialog.entity as any).username === channelUsername.replace('@', '')) {
                  console.log('✅ Канал найден в диалогах!');
                  console.log(`  - ID: ${dialog.entity.id}`);
                  console.log(`  - Название: ${(dialog.entity as any).title || 'Unknown'}`);

                  // Попробуем получить сообщения
                  try {
                    const messages = await client.getMessages(dialog.entity, { limit: 3 });
                    console.log(`✅ Получено ${messages.length} сообщений через dialogs!`);

                    if (messages.length > 0) {
                      console.log('\n🎉 УСПЕХ! Канал @vacancy_it_ulbitv полностью доступен!');
                    }
                  } catch (msgError) {
                    console.log('❌ Ошибка получения сообщений через dialogs:', msgError);
                  }
                  break;
                }
              }
            }
          } catch (dialogsError) {
            console.log('❌ Dialogs метод не сработал:', dialogsError);
          }
        }

      } catch (accessError) {
        console.error('❌ Канал недоступен:', accessError);

        // 4.2. Детальная диагностика причин
        console.log('\n🔍 4.2. Детальная диагностика причин недоступности...');

        if (accessError instanceof Error) {
          const errorMessage = accessError.message.toLowerCase();

          if (errorMessage.includes('flood')) {
            console.log('⚠️ ПРИЧИНА: Rate limiting (слишком много запросов)');
            console.log('💡 РЕШЕНИЕ: Подождите 10-30 минут и попробуйте снова');

          } else if (errorMessage.includes('chat not found') || errorMessage.includes('channel_invalid')) {
            console.log('⚠️ ПРИЧИНА: Канал не найден или изменил username');
            console.log('💡 РЕШЕНИЯ:');
            console.log('  1. Проверьте правильность username в Telegram app');
            console.log('  2. Возможно канал изменил @username');
            console.log('  3. Попробуйте найти канал по названию в поиске Telegram');

          } else if (errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
            console.log('⚠️ ПРИЧИНА: Нет доступа к каналу');
            console.log('💡 РЕШЕНИЯ:');
            console.log('  1. Подпишитесь на канал вручную в Telegram app');
            console.log('  2. Канал может быть приватным - нужно получить приглашение');
            console.log('  3. Проверьте, не заблокирован ли ваш аккаунт в канале');

          } else if (errorMessage.includes('peer_id_invalid')) {
            console.log('⚠️ ПРИЧИНА: Некорректный ID канала');
            console.log('💡 РЕШЕНИЯ:');
            console.log('  1. Убедитесь что username написан с @');
            console.log('  2. Попробуйте использовать полную ссылку: https://t.me/vacancy_it_ulbitv');
            console.log('  3. Канал может быть временно недоступен');

          } else {
            console.log('⚠️ ПРИЧИНА: Неизвестная ошибка');
            console.log(`📋 Текст ошибки: ${accessError.message}`);
            console.log('💡 ОБЩИЕ РЕШЕНИЯ:');
            console.log('  1. Проверьте интернет соединение');
            console.log('  2. Попробуйте через VPN если есть блокировки');
            console.log('  3. Убедитесь что канал существует в Telegram app');
          }
        }

        // 4.3. Попытка альтернативного доступа
        console.log('\n🔍 4.3. Попытка альтернативного доступа...');

        // Попробуем без @
        if (channelUsername.startsWith('@')) {
          const withoutAt = channelUsername.substring(1);
          console.log(`Пробуем без @: ${withoutAt}`);

          try {
            const altEntity = await telegramClient.getChannelInfo(withoutAt);
            if (altEntity) {
              console.log('✅ Канал доступен без @ символа!');
              console.log('💡 Используйте в конфигурации:', withoutAt);
            }
          } catch {
            console.log('❌ Не помогло');
          }
        }
      }

      await telegramClient.disconnect();

    } catch (connectionError) {
      console.error('❌ Ошибка подключения к Telegram:', connectionError);
      console.log('💡 Проверьте интернет соединение и настройки API');
    }

  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error);
  }

  // 5. Рекомендации
  console.log('\n' + '='.repeat(60));
  console.log('🎯 ИТОГОВЫЕ РЕКОМЕНДАЦИИ:');
  console.log('='.repeat(60));

  console.log('\n🔄 ВАРИАНТЫ РЕШЕНИЯ ПРОБЛЕМЫ:');
  console.log('1. **Подписка на канал**: Зайдите в Telegram app и подпишитесь на канал вручную');
  console.log('2. **Проверка username**: Убедитесь что @vacancy_it_ulbitv правильный');
  console.log('3. **Альтернативные каналы**: Используйте проверенные каналы пока решаете проблему');
  console.log('4. **VPN**: Попробуйте через VPN если есть региональные блокировки');

  console.log('\n🚀 ПРОВЕРЕННЫЕ РАБОТАЮЩИЕ КАНАЛЫ:');
  console.log('   @jobs_it_ru, @job_vacancy_it, @it_vakansii, @devjobs_feed');

  console.log('\n💡 После решения проблемы с доступом, @vacancy_it_ulbitv будет работать отлично!');
}

// Запуск диагностики
if (import.meta.url === `file://${process.argv[1]}`) {
  const channelToCheck = process.argv[2] || '@vacancy_it_ulbitv';

  diagnosticChannel(channelToCheck)
    .then(() => {
      console.log('\n🏁 Диагностика завершена');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Ошибка диагностики:', error);
      process.exit(1);
    });
}

export { diagnosticChannel }; 