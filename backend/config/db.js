const mongoose = require('mongoose');

// MongoDB ga ulanish funksiyasi
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB ulandi: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB ulanish xatosi: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
