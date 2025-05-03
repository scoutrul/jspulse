import mongoose from "mongoose";
import "dotenv/config";

const mongoUrl =
  process.env.NODE_ENV === "development" ? process.env.MONGO_URI_LOCALHOST : process.env.MONGO_URI;

if (!mongoUrl) {
  console.error("Error: MONGO_URI is not set.");
  process.exit(1);
}

async function clearDatabase() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB");

    // Add your logic to clear the database here
    console.log("Clearing database...");

    // Example: await SomeModel.deleteMany({});

    console.log("Database cleared successfully.");
  } catch (error) {
    console.error("Error clearing the database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

clearDatabase();
