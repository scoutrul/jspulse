console.log('Test seeding file compilation');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { Vacancy } from '../models/Vacancy';
import mockVacancies from './mockVacancies';

// Загружаем .env из папки backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_URL;

async function seedDatabase() {
  if (!MONGO_URL) {
    console.error('Ошибка: Переменная окружения MONGO_URL не установлена.');
    process.exit(1);
  }

  console.log('Подключение к MongoDB для сидинга...');
  try {
    await mongoose.connect(MONGO_URL);
    console.log('MongoDB подключен для сидинга.');

    console.log('Очистка коллекции перед сидингом...');
    await Vacancy.deleteMany({});
    console.log('Старые данные удалены.');

    // TODO: Убедиться, что структура mockVacancies соответствует IVacancy
    console.log('Добавление моковых вакансий...');
    const result = await Vacancy.insertMany(mockVacancies as any[]);
    console.log(`Успешно добавлено ${result.length} моковых вакансий`);

    console.log('Добавленные вакансии (первые 5):');
    result.slice(0, 5).forEach((vacancy, index) => {
      const v = vacancy as InstanceType<typeof Vacancy>;
      console.log(`${index + 1}. ${v.title} - ${v.company}`);
    });
    if (result.length > 5) {
      console.log('... и еще', result.length - 5);
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('Ошибка при заполнении базы данных:', error.message);
    } else {
      console.error('Неизвестная ошибка при заполнении базы данных:', error);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Соединение с MongoDB (сидинг) закрыто.');
  }
}

seedDatabase(); 