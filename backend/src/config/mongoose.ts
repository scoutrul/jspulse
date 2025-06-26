// Wrapper для mongoose с поддержкой ESM
let mongoose: any;

async function getMongoose() {
  if (!mongoose) {
    // Динамический импорт для обхода ESM/CommonJS проблем
    try {
      // Пробуем через createRequire для CommonJS совместимости
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      mongoose = require('mongoose');
    } catch (error) {
      // Fallback на динамический импорт
      try {
        const mongooseModule = await import('mongoose/index.js');
        mongoose = mongooseModule.default || mongooseModule;
      } catch (error2) {
        const mongooseModule = await import('mongoose');
        mongoose = mongooseModule.default || mongooseModule;
      }
    }
  }
  return mongoose;
}

export { getMongoose };
export default getMongoose; 