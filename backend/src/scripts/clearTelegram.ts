import dotenv from 'dotenv';
dotenv.config();

import mongoose from '../config/database.js';

async function getVacancyModel() {
  const vacancySchema = new mongoose.Schema({}, { strict: false, collection: 'vacancies' });
  return mongoose.model('Vacancy', vacancySchema);
}

async function main() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://mongodb:27017/jspulse';
  await mongoose.connect(mongoUrl);
  const Vacancy = await getVacancyModel();
  const res = await Vacancy.deleteMany({ source: 'telegram' });
  console.log(`Deleted telegram vacancies: ${res.deletedCount}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('❌ Failed to clear telegram vacancies:', e);
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});
