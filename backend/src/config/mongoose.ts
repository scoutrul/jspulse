// Wrapper для mongoose с поддержкой ESM
let mongoose: any;

async function getMongoose() {
  if (!mongoose) {
    // Простой динамический импорт mongoose
    try {
      const mongooseModule = await import('mongoose');
      mongoose = mongooseModule.default || mongooseModule;
    } catch (error) {
      throw new Error('Failed to import mongoose: ' + error);
    }
  }
  return mongoose;
}

export { getMongoose };
export default getMongoose; 