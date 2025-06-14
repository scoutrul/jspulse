import mongoose from "mongoose";
import { Vacancy } from "./dist/models/Vacancy.js";

async function testSave() {
  try {
    await mongoose.connect("mongodb://localhost:27017/jspulse");
    console.log("✅ Подключен к MongoDB");

    // Создаем тестовую запись с новыми полями
    const testVacancy = {
      externalId: "test-123",
      title: "Test Vacancy",
      company: "Test Company",
      location: "Test Location",
      url: "https://test.com",
      publishedAt: new Date(),
      source: "test",
      description: "Short description",
      fullDescription: {
        raw: "<p>Full HTML description</p>",
        preview: "Full HTML description",
        processed: "<p>Full HTML description</p>",
        textOnly: "Full HTML description"
      },
      processedHtml: "<p>Processed HTML</p>",
      skills: ["javascript", "react"]
    };

    console.log("📝 Сохраняю тестовую вакансию...");
    const saved = await Vacancy.create(testVacancy);
    console.log("✅ Сохранено:", {
      id: saved._id,
      title: saved.title,
      hasFullDescription: !!saved.fullDescription,
      hasProcessedHtml: !!saved.processedHtml
    });

    // Проверяем, что данные действительно сохранились
    const found = await Vacancy.findById(saved._id);
    console.log("🔍 Найдено:", {
      id: found._id,
      title: found.title,
      fullDescription: found.fullDescription,
      processedHtml: found.processedHtml
    });

    // Удаляем тестовую запись
    await Vacancy.findByIdAndDelete(saved._id);
    console.log("🗑️ Тестовая запись удалена");

  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Отключен от MongoDB");
  }
}

testSave(); 