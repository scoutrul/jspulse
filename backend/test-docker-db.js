import mongoose from 'mongoose';
import { Vacancy } from './src/models/Vacancy.js';

async function testDockerDB() {
  try {
    // Используем MongoDB URI из Docker окружения
    const mongoUri = process.env.MONGODB_URI || 'mongodb://mongodb:27017/jspulse';
    console.log('🔗 Подключаюсь к MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Подключение к MongoDB успешно');
    
    // Найдем вакансию напрямую через Mongoose
    const vacancy = await Vacancy.findOne({_id: '684d98d1c860a12b8d798fbe'}).lean();
    console.log('📋 Найдена вакансия:', vacancy?.title);
    console.log('🔍 Поле fullDescription существует:', !!vacancy?.fullDescription);
    
    if (vacancy?.fullDescription) {
      console.log('📝 Тип fullDescription:', typeof vacancy.fullDescription);
      console.log('🔑 Ключи fullDescription:', Object.keys(vacancy.fullDescription));
      console.log('📄 Превью processed:', vacancy.fullDescription.processed?.slice(0, 100) + '...');
    } else {
      console.log('❌ fullDescription отсутствует или пустое');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Отключение от MongoDB');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

testDockerDB(); 