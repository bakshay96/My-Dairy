const mongoose = require("mongoose");
require("dotenv").config();

const mongo_url = process.env.mongo_url;
console.log("DEBUG: Using MONGO_URL:", mongo_url);


if (!mongo_url) {
  console.error("ERROR: mongo_url is not defined in environment variables");
  process.exit(1);
}

// Note: useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 8+
const mongoOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

const connection = mongoose
  .connect(mongo_url, mongoOptions)
  .then(() => {
    console.log("✓ MongoDB connection successful");
    return mongoose;
  })
  .catch((error) => {
    console.error("✗ MongoDB connection failed:", error.message);
    return Promise.reject(error);
  });

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose disconnected from MongoDB");
});

mongoose.connection.on("error", (error) => {
  console.error("Mongoose connection error:", error);
});

process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed on app termination");
    process.exit(0);
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    process.exit(1);
  }
});

module.exports = { connection };