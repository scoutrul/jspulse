import dotenv from 'dotenv';
dotenv.config();

import mongoose from '../config/database.js';
import { containerFactory } from '../container/ContainerFactory.js';

async function main() {
  const mongoUrl = process.env.MONGO_URI || 'mongodb://mongodb:27017/jspulse';
  await mongoose.connect(mongoUrl);

  const container = containerFactory.createProduction();
  const vacancyRepository = container.resolve('IVacancyRepository') as any;
  const { TelegramParserService } = await import('../services/TelegramParserService.js');

  const service = new TelegramParserService(vacancyRepository);

  const result = await service.parseChannel('@vacancy_it_ulbitv');
  console.log('\nRESULT:', result);

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('❌ parseTelegramUlbi failed:', e);
  try { await mongoose.disconnect(); } catch { }
  process.exit(1);
});
