/**
 * Скрипт для заполнения базы данных тестовыми вакансиями
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Vacancy = require('../models/Vacancy');
const mockVacancies = require('./mockVacancies');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/jspulse';

// Подключение к MongoDB
mongoose.connect(MONGO_URL)
  .then(async () => {
    console.log('MongoDB подключена для заполнения данными');
    
    try {
      // Очистка коллекции
      await Vacancy.deleteMany({});
      console.log('Старые данные удалены');
      
      // Заполнение новыми данными
      const result = await Vacancy.insertMany(mockVacancies);
      console.log(`Успешно добавлено ${result.length} вакансий`);
      
      // Список добавленных вакансий
      console.log('Добавленные вакансии:');
      result.forEach((vacancy, index) => {
        console.log(`${index + 1}. ${vacancy.title} - ${vacancy.company}`);
      });
      
    } catch (error) {
      console.error('Ошибка при заполнении базы данных:', error.message);
    } finally {
      // Закрываем соединение
      mongoose.connection.close();
      console.log('Соединение с MongoDB закрыто');
    }
  })
  .catch(err => {
    console.error('Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  }); 