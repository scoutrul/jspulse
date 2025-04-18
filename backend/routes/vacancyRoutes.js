const express = require('express');
const router = express.Router();
const Vacancy = require('../models/Vacancy');

// Получить все вакансии
router.get('/', async (req, res) => {
  try {
    const vacancies = await Vacancy.find().sort({ createdAt: -1 });
    res.json({ 
      status: 'OK',
      message: 'Вакансии успешно получены',
      data: vacancies
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Ошибка при получении вакансий',
      error: error.message
    });
  }
});

// Получить вакансию по ID
router.get('/:id', async (req, res) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);
    
    if (!vacancy) {
      return res.status(404).json({ 
        status: 'ERROR',
        message: 'Вакансия не найдена'
      });
    }
    
    res.json({ 
      status: 'OK',
      message: 'Вакансия успешно получена',
      data: vacancy
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Ошибка при получении вакансии',
      error: error.message
    });
  }
});

// Фильтрация вакансий по тегам
router.get('/filter/tags', async (req, res) => {
  try {
    const { tags } = req.query;
    
    if (!tags) {
      return res.status(400).json({ 
        status: 'ERROR',
        message: 'Не указаны теги для фильтрации'
      });
    }

    const tagsArray = tags.split(',');
    
    const vacancies = await Vacancy.find({
      tags: { $in: tagsArray }
    }).sort({ createdAt: -1 });
    
    res.json({ 
      status: 'OK',
      message: 'Вакансии успешно отфильтрованы по тегам',
      data: vacancies
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      message: 'Ошибка при фильтрации вакансий',
      error: error.message
    });
  }
});

module.exports = router; 