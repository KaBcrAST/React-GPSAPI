const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://thomaslaperesupinfo:ROwAq6izugTXfaTd@cluster0.f07klyp.mongodb.net/werego', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;