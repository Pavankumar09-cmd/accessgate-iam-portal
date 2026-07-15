import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Establish connection to Mongoose database
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[SYSTEM] ACCESSGATE SECURITY SERVER ONLINE ON PORT ${PORT}`);
  });
};

startServer();
