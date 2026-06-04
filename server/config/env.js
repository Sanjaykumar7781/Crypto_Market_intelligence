import dotenv from 'dotenv';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.join(__dirname, '..', '.env');
const serverEnvPath = path.join(__dirname, '.env');

dotenv.config();
dotenv.config({ path: rootEnvPath, override: true });
if (!fs.existsSync(rootEnvPath) && fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath, override: true });
}

const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  clientUrl: rawClientUrl.endsWith('/') ? rawClientUrl.slice(0, -1) : rawClientUrl,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
  mongoDbName: process.env.MONGODB_DB_NAME || 'crypto_market',
  mongoTimeoutMs: Number(process.env.MONGODB_TIMEOUT_MS || 8000),
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-secret-replace-in-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  socketMarketIntervalMs: Number(process.env.SOCKET_MARKET_INTERVAL_MS || 45_000),
  groqApiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || null,
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
};

export function validateEnv() {
  if (env.nodeEnv === 'production') {
    const missing = [];

    if (!env.mongoUri) {
      missing.push('MONGODB_URI');
    }

    if (!env.jwtSecret) {
      missing.push('JWT_SECRET');
    }

    if (env.jwtSecret === 'dev-secret-replace-in-production') {
      missing.push('JWT_SECRET (using development default - NOT SECURE for production)');
    }

    if (env.jwtSecret && env.jwtSecret.length < 32) {
      missing.push('JWT_SECRET (must be at least 32 characters for production)');
    }

    if (missing.length) {
      throw new Error(`Missing or invalid environment variables for production:\n${missing.map(m => `  - ${m}`).join('\n')}`);
    }

    if (!env.groqApiKey) {
      console.warn('⚠️  Warning: GROQ_API_KEY is not set; AI features will be disabled.');
    }
  }
}
