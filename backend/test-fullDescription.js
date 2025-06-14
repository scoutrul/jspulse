import mongoose from 'mongoose';
import { Vacancy } from './src/models/Vacancy.js';

async function testFullDescription() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jspulse');
    console.log('✅ Подключение к MongoDB успешно');
    
    // Найдем вакансию напрямую через Mongoose
    const vacancy = await Vacancy.findOne({externalId: '121620774'}).lean();
    console.log('📋 Найдена вакансия:', vacancy?.title);
    console.log('🔍 Поле fullDescription существует:', !!vacancy?.fullDescription);
    
    if (vacancy?.fullDescription) {
      console.log('📝 Тип fullDescription:', typeof vacancy.fullDescription);
      console.log('🔑 Ключи fullDescription:', Object.keys(vacancy.fullDescription));
      console.log('📄 Превью processed:', vacancy.fullDescription.processed?.slice(0, 100) + '...');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Отключение от MongoDB');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testFullDescription(); 