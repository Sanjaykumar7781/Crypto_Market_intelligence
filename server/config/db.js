import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise;

export async function connectDatabase() {
  if (!env.mongoUri) {
    console.warn('MongoDB disabled: set MONGODB_URI in server/.env.');
    return null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongoUri, {
        dbName: env.mongoDbName,
        serverSelectionTimeoutMS: env.mongoTimeoutMs,
      })
      .then((connection) => {
        console.log('MongoDB connected');
        return connection;
      })
      .catch((error) => {
        connectionPromise = null;
        const srvHint = error.message?.includes('querySrv')
          ? ' Check the MongoDB Atlas SRV URI, DNS/network access, and Atlas IP allowlist. You can also use the non-SRV mongodb:// connection string from Atlas.'
          : '';
        console.error(`MongoDB connection failed: ${error.message}.${srvHint}`);
        return null;
      });
  }

  return connectionPromise;
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
