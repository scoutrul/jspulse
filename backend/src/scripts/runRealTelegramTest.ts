#!/usr/bin/env node

/**
 * Быстрый запуск теста парсинга Telegram канала @vacancy_it_ulbitv
 * Использование: npm run test:telegram:real
 */

import { testRealTelegramParsing } from './testRealTelegramParsing.js';

console.log('🚀 Запуск теста реального Telegram парсинга...\n');

testRealTelegramParsing()
  .then(() => {
    console.log('\n✅ Тест завершен успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Тест завершился с ошибкой:', error);
    process.exit(1);
  }); 