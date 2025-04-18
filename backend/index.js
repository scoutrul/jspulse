require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Импортируем маршруты
const vacancyRoutes = require('./routes/vacancyRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/jspulse';

console.log('Используемый URL MongoDB:', MONGO_URL);

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

// Подключаем маршруты для вакансий
app.use('/api/vacancies', vacancyRoutes);

// 404 маршрут для неизвестных запросов
app.use('*', (req, res) => {
  res.status(404).json({ 
    status: 'ERROR', 
    message: 'Запрашиваемый ресурс не найден' 
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'ERROR', 
    message: 'Внутренняя ошибка сервера',
    error: err.message 
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
