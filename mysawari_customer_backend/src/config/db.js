const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn('⚠️  MONGO_URI is missing in .env! Backend is running without DB connection.');
      return;
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`================================`);
    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
    console.log(`================================`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
