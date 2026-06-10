import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

mongoose.set('strictQuery', true);

let memoryServer = null;

/* In development you can run the whole stack with zero external services by
   setting USE_INMEMORY_DB=true — it spins up an ephemeral in-memory MongoDB.
   In production it always uses the configured MONGO_URI. */
const resolveMongoUri = async () => {
  if (process.env.USE_INMEMORY_DB === 'true') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    logger.warn('Using in-memory MongoDB (data will not persist)');
    return memoryServer.getUri();
  }
  return env.mongoUri;
};

export const connectDatabase = async () => {
  try {
    const uri = await resolveMongoUri();
    await mongoose.connect(uri);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return mongoose.connection;
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};
