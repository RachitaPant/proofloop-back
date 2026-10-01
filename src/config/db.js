const mongoose = require('mongoose');

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DATABASE || 'proofloop',
  });
  console.log('Connected to MongoDB');
}

module.exports = connectDB;
