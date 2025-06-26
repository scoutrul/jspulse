/**
 * Тестовый скрипт для проверки MessageProcessor
 * Использует реальные примеры сообщений из Telegram каналов
 */

import { MessageProcessor } from '../services/telegram/MessageProcessor.js';
import type { TelegramMessage } from '@jspulse/shared';

// Примеры реальных сообщений из Telegram каналов
const testMessages: TelegramMessage[] = [
  {
    id: 1,
    text: `🚀 Вакансия: Frontend Developer (React/TypeScript)

Компания: TechCorp LLC
Локация: Москва/Удаленно
Зарплата: от 120к до 200к руб.

Требования:
• React, TypeScript
• Redux, Redux Toolkit
• HTML5, CSS3, SASS
• Git, Webpack
• Опыт от 2 лет

Обязанности:
• Разработка веб-приложений
• Код-ревью
• Участие в планировании

Контакты: @hr_manager_tech`,
    date: new Date(),
    channelId: '123',
    channelUsername: '@vacancy_it_ulbitv'
  },
  {
    id: 2,
    text: `💼 Ищем Python разработчика

В стартап нужен Senior Python Developer
Опыт: 3+ года
Стек: Python, Django, PostgreSQL, Docker
Зарплата: 150-250к
Локация: СПб или удаленно

Что делать:
- Backend API разработка
- Оптимизация производительности
- Менторинг джунов

📩 Отклики: python.jobs@example.com`,
    date: new Date(),
    channelId: '123',
    channelUsername: '@vacancy_it_ulbitv'
  },
  {
    id: 3,
    text: `📱 Требуется iOS Developer

Компания FinTech
Москва, офис + гибрид
$2000-4000

Нужно знать:
Swift, UIKit, SwiftUI, CoreData
Архитектуры: MVVM, Coordinator
CI/CD, Git Flow

Контакт: @ios_recruiter_fintech
+7 (999) 123-45-67`,
    date: new Date(),
    channelId: '123',
    channelUsername: '@vacancy_it_ulbitv'
  },
  {
    id: 4,
    text: `🔥 СРОЧНО! DevOps Engineer

Международная компания
Remote work
Зарплата: от 300к рублей

Технологии:
- Kubernetes, Docker
- AWS, Terraform
- Jenkins, GitLab CI
- Monitoring: Prometheus, Grafana

Опыт от 3 лет обязательно
english B2+

CV на devops@company.com`,
    date: new Date(),
    channelId: '123',
    channelUsername: '@vacancy_it_ulbitv'
  },
  {
    id: 5,
    text: `Продам iPhone 15 Pro Max 256GB
Цена: 150000 рублей
Состояние отличное
Все документы есть
Контакт: @seller123`,
    date: new Date(),
    channelId: '123',
    channelUsername: '@vacancy_it_ulbitv'
  },
  {
    id: 6,
    text: `Вакансия Junior Frontend

Требования: знание HTML, CSS, JS
Зарплата не указана
Опыт желательно но не обязательно

Обращаться в ЛС`,
    date: new Date(),
    channelId: '123',
    channelUsername: '@vacancy_it_ulbitv'
  },
  {
    id: 7,
    text: `🎯 Vacancy: Full Stack Developer

Company: StartupXYZ
Location: Ekaterinburg
Salary: 180к-250к RUB

Tech Stack:
✅ Node.js, Express.js
✅ React, NextJS  
✅ PostgreSQL, Redis
✅ Docker, AWS

Requirements:
• 2+ years experience
• English B1+
• Team player

Apply: hr@startupxyz.com
Telegram: @hr_startupxyz`,
    date: new Date(),
    channelId: '123',
    channelUsername: '@vacancy_it_ulbitv'
  }
];

async function testMessageProcessor(): Promise<void> {
  console.log('🧪 Starting MessageProcessor test...\n');

  try {
    // Создаем MessageProcessor
    const processor = new MessageProcessor();
    console.log('✅ MessageProcessor initialized\n');

    // Обрабатываем каждое сообщение
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n📝 Testing message ${i + 1}/${testMessages.length}:`);
      console.log(`Text preview: "${message.text.substring(0, 60)}..."`);
      console.log('---');

      const result = await processor.processMessage(message);

      console.log(`📊 Results:`);
      console.log(`  ✓ Valid: ${result.valid}`);
      console.log(`  ✓ Confidence: ${(result.extractedData.confidence * 100).toFixed(1)}%`);

      if (result.extractedData.title) {
        console.log(`  ✓ Title: "${result.extractedData.title}"`);
      }

      if (result.extractedData.company) {
        console.log(`  ✓ Company: "${result.extractedData.company}"`);
      }

      if (result.extractedData.location) {
        console.log(`  ✓ Location: "${result.extractedData.location}"`);
      }

      if (result.extractedData.salary) {
        const salary = result.extractedData.salary;
        let salaryStr = '';
        if (salary.from && salary.to) {
          salaryStr = `${salary.from}-${salary.to} ${salary.currency || 'RUB'}`;
        } else if (salary.from) {
          salaryStr = `from ${salary.from} ${salary.currency || 'RUB'}`;
        }
        console.log(`  ✓ Salary: ${salaryStr}`);
      }

      if (result.extractedData.skills && result.extractedData.skills.length > 0) {
        console.log(`  ✓ Skills: ${result.extractedData.skills.join(', ')}`);
      }

      if (result.extractedData.contact) {
        console.log(`  ✓ Contact: ${result.extractedData.contact}`);
      }

      if (result.errors && result.errors.length > 0) {
        console.log(`  ❌ Errors: ${result.errors.join(', ')}`);
      }
    }

    // Тестируем пакетную обработку
    console.log('\n\n🔄 Testing batch processing...');
    const batchResults = await processor.processMessages(testMessages);

    const validCount = batchResults.filter(r => r.valid).length;
    const averageConfidence = batchResults.reduce((sum, r) => sum + r.extractedData.confidence, 0) / batchResults.length;

    console.log('\n📈 Batch Processing Results:');
    console.log(`  📊 Total messages: ${batchResults.length}`);
    console.log(`  ✅ Valid vacancies: ${validCount} (${(validCount / batchResults.length * 100).toFixed(1)}%)`);
    console.log(`  📏 Average confidence: ${(averageConfidence * 100).toFixed(1)}%`);

    // Анализ по типам
    console.log('\n🔍 Analysis by message type:');
    batchResults.forEach((result, index) => {
      const messageType = result.valid ? '✅ Valid Vacancy' :
        result.extractedData.confidence > 0.1 ? '⚠️ Low Confidence' :
          '❌ Invalid';
      console.log(`  ${index + 1}. ${messageType} (${(result.extractedData.confidence * 100).toFixed(1)}%)`);
    });

    console.log('\n✅ MessageProcessor test completed successfully!');
    console.log('🚀 Ready to integrate with TelegramClient');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Запуск теста, если скрипт выполняется напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  testMessageProcessor()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testMessageProcessor }; 