const mongoose = require('mongoose');

// Схема для вакансий
const vacancySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  salary: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isSentToTG: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vacancy', vacancySchema); 