#!/usr/bin/env node

// Простой скрипт для инициализации данных в JSPulse

import http from 'http';

console.log('🚀 Инициализация данных JSPulse...');

// Функция для выполнения HTTP запроса
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function initializeData() {
  try {
    console.log('📋 Проверка подключения к backend...');
    const health = await makeRequest('http://localhost:3001/health');
    if (health.status !== 200) {
      throw new Error('Backend недоступен');
    }
    console.log('✅ Backend доступен');

    console.log('🔧 Запуск парсинга HeadHunter...');
    const parseResult = await makeRequest('http://localhost:3001/api/admin/parse-hh', 'POST');
    console.log('📊 Результат парсинга:', parseResult.data.message || parseResult.data);

    console.log('⏳ Ожидание завершения парсинга (30 секунд)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('📈 Проверка результатов...');
    const vacancies = await makeRequest('http://localhost:3001/api/vacancies');
    const stats = await makeRequest('http://localhost:3001/api/admin/stats');
    
    console.log(`📊 Статистика:`);
    console.log(`  - Вакансий в API: ${vacancies.data?.meta?.totalItems || 0}`);
    console.log(`  - Вакансий в базе: ${stats.data?.data?.vacancies?.total || 0}`);
    
    if (vacancies.data?.meta?.totalItems > 0) {
      console.log('🎉 Данные успешно загружены!');
      console.log('🌐 Фронтенд: http://localhost:3000');
      console.log('📱 API: http://localhost:3001/api/vacancies');
    } else {
      console.log('⚠️ Данные не найдены. Возможно, нужно подождать или проверить логи.');
    }

  } catch (error) {
    console.error('❌ Ошибка инициализации:', error.message);
    process.exit(1);
  }
}

initializeData(); 