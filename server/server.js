import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.DB_HELPER_PORT || 5000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Crypto database server running');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crypto-market-db-helper' });
});

app.listen(port, () => {
  console.log(`Database helper server started on http://localhost:${port}`);
});

connectDatabase();
