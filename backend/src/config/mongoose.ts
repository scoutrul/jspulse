// Wrapper для mongoose с поддержкой ESM
let mongoose: any;

async function getMongoose() {
  if (!mongoose) {
    // Динамический импорт для обхода ESM/CommonJS проблем
    const mongooseModule = await import('mongoose');
    mongoose = mongooseModule.default || mongooseModule;
  }
  return mongoose;
}

export { getMongoose };
export default getMongoose; 