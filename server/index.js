import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { connectDatabase } from './db.js';
import { env, validateEnv } from './config/env.js';

import { asyncHandler } from './middleware/asyncHandler.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import coinRoutes from './routes/coinRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userDataRoutes from './routes/userDataRoutes.js';

import {
  getChart,
  getCoin,
  getCoins,
  getCryptoNews,
  getGlobal,
  getHealth,
  getMarket,
  getMarketInsights,
  getMarketsPage,
  getTrendingCoins,
  getTestCmc,
} from './controllers/coinController.js';

import {
  getInsights,
  getMarkets,
} from './services/cryptoService.js';

const app = express();
const server = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================
   CORS CONFIGURATION
============================================ */

const allowedOrigins = [
  'http://localhost:5173',
  env.clientUrl,
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      console.warn(`Blocked CORS origin: ${origin}`);

      return callback(
        new Error(`Origin ${origin} not allowed by CORS`)
      );
    },
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  })
);

app.options(/.*/, cors());

/* ============================================
   SECURITY
============================================ */

app.use(express.json());

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

/* ============================================
   SOCKET.IO
============================================ */

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.endsWith('.vercel.app') ||
        origin === env.clientUrl ||
        origin === 'http://localhost:5173'
      ) {
        return callback(null, true);
      }

      callback(new Error('Socket CORS blocked'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

/* ============================================
   RATE LIMITERS
============================================ */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

/* ============================================
   ROUTES
============================================ */

app.use('/api/auth', authLimiter, authRoutes);

app.use('/api', apiLimiter);

app.use('/api/profile', profileRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/data', userDataRoutes);

/* ============================================
   API ENDPOINTS
============================================ */

app.get('/api/health', getHealth);
app.get('/api/market', asyncHandler(getMarket));
app.get('/api/markets', asyncHandler(getMarketsPage));
app.get('/api/coins', asyncHandler(getCoins));
app.get('/api/global', asyncHandler(getGlobal));
app.get('/api/trending', asyncHandler(getTrendingCoins));
app.get('/api/insights', asyncHandler(getMarketInsights));
app.get('/api/coins/:id', asyncHandler(getCoin));
app.get('/api/coins/:id/chart', asyncHandler(getChart));
app.get('/api/test-cmc', getTestCmc);

app.get('/', asyncHandler(getCryptoNews));

/* ============================================
   SOCKET EVENTS
============================================ */

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.emit('connected', {
    service: 'crypto-market-realtime',
  });
});

setInterval(async () => {
  try {
    const [market, insights] = await Promise.all([
      getMarkets(30),
      getInsights(),
    ]);

    io.emit('market:update', {
      market,
      insights,
      currency: 'usd',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
  }
}, env.socketMarketIntervalMs);

/* ============================================
   FRONTEND SERVING
============================================ */

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');

  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

/* ============================================
   ERROR HANDLING
============================================ */

// Silence favicon.ico 404 noise
app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use(notFound);
app.use(errorHandler);

/* ============================================
   START SERVER
============================================ */

try {
  validateEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

connectDatabase();

server.listen(env.port, () => {
  console.log(
    `Crypto Market API running on port ${env.port}`
  );
});