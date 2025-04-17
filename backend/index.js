require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:27017/jsjobs';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB подключение
mongoose.connect(MONGO_URL)
  .then(() => console.log('MongoDB подключен'))
  .catch(err => console.error('MongoDB ошибка подключения:', err));

// Простой маршрут для проверки работы API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API работает' });
});

// Тестовый маршрут для вакансий (пока без логики)
app.get('/api/vacancies', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API вакансий работает', 
    data: [
      { 
        id: 1, 
        title: 'Frontend разработчик (React)', 
        company: 'Тестовая компания', 
        location: 'Удаленно',
        tags: ['react', 'javascript', 'typescript']
      }
    ] 
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
