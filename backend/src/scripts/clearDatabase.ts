import mongoose from "mongoose";
import "dotenv/config";
import { Vacancy } from "../models/Vacancy.js";

const mongoUrl =
  process.env.NODE_ENV === "development" ? process.env.MONGO_URI_LOCALHOST : process.env.MONGO_URI;

if (!mongoUrl) {
  console.error("Error: MONGO_URI is not set.");
  process.exit(1);
}

async function clearDatabase() {
  try {
    await mongoose.connect(mongoUrl as string);
    console.log("Connected to MongoDB");

    console.log("Clearing database...");
    
    // Удаляем все вакансии из базы данных
    const result = await Vacancy.deleteMany({});
    console.log(`Удалено вакансий: ${result.deletedCount}`);

    console.log("Database cleared successfully.");
  } catch (error) {
    console.error("Error clearing the database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

clearDatabase();
