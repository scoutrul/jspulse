import mongoose from 'mongoose';
import { VacancyRepository } from './src/repositories/VacancyRepository.js';

async function testRepository() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/jspulse';
    await mongoose.connect(mongoUri);
    console.log('✅ Подключение к MongoDB успешно');
    
    const repository = new VacancyRepository();
    
    // Найдем вакансию через Repository
    const vacancy = await repository.findById('684d98d1c860a12b8d798fbe');
    console.log('📋 Найдена вакансия:', vacancy?.title);
    console.log('🔍 Поле fullDescription существует:', !!vacancy?.fullDescription);
    console.log('📝 Все поля вакансии:', Object.keys(vacancy || {}));
    
    if (vacancy?.fullDescription) {
      console.log('📄 Тип fullDescription:', typeof vacancy.fullDescription);
      console.log('🔑 Ключи fullDescription:', Object.keys(vacancy.fullDescription));
    } else {
      console.log('❌ fullDescription отсутствует или null');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Отключение от MongoDB');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testRepository(); 