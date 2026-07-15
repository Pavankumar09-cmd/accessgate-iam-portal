import mongoose from 'mongoose';

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/accessgate';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[DATABASE] Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[DATABASE] Connection failed:', error);
    process.exit(1);
  }
};
