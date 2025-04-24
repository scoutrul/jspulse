import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vacancyRoutes from './routes/vacancyRoutes.js';

// Загрузка переменных окружения
dotenv.config();

const app = express();
// Читаем стандартную переменную PORT или используем 5000
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Разрешаем CORS-запросы (настройте более строго для продакшена)
app.use(express.json()); // Для парсинга JSON-тел запросов

// Подключение к MongoDB
const mongoUri = process.env.MONGO_URI; // Берем только из env

if (!mongoUri) {
  console.error('MONGO_URI не определена в переменных окружения!'); // Обновляем сообщение об ошибке
  process.exit(1); // Выход, если нет URI для подключения к БД
}

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB подключена успешно'))
  .catch(err => {
    console.error('Ошибка подключения к MongoDB:', err);
    process.exit(1); // Выход при ошибке подключения
  });

// Простой тестовый роут
app.get('/', (req, res) => {
  res.send('Backend JSPulse работает!');
});

// TODO: Подключить основные роуты приложения (например, для вакансий)
// import vacancyRoutes from './routes/vacancyRoutes'; // Предполагаемый путь
// app.use('/api/vacancies', vacancyRoutes);

// Application Routes
// TODO: Connect main application routes
app.use('/api/vacancies', vacancyRoutes); // Подключаем маршруты вакансий

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
