const mongoose = require('mongoose');
require('dotenv').config(); // Load .env variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
