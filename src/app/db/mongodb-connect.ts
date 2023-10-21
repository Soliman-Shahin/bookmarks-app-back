import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri: string = process.env.MONGO_URI as string;

// Use a singleton pattern to cache/reuse mongoose connection
const connectToDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {});
  }
};

const db: mongoose.Connection = mongoose.connection;

db.on("error", (err: Error) => {
  console.error("Error while attempting to connect to MongoDB:");
  console.error(err.message);
  console.error(err.stack);
  process.exit(1); // Exit the process on connection error
});

db.once("open", () => {
  console.log("[database]: Connected to MongoDB successfully :)");
});

export { connectToDB };
