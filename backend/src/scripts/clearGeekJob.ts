import mongoose from "../config/database.js";
import { Vacancy } from "../models/Vacancy.js";

const SOURCE = "geekjob.ru";

async function clearGeekJob() {
  const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017/jspulse";
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Подключено к MongoDB");
    const count = await Vacancy.countDocuments({ source: SOURCE });
    console.log(`ℹ️ Найдено записей GeekJob: ${count}`);
    if (count > 0) {
      const res = await Vacancy.deleteMany({ source: SOURCE });
      console.log(`🧹 Удалено GeekJob-вакансий: ${res.deletedCount}`);
    }
  } catch (e) {
    console.error("❌ Ошибка очистки GeekJob:", e);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

clearGeekJob();


