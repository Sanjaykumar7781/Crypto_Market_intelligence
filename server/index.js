import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getInsights, getMarkets } from './services/cryptoService.js';
import { connectDatabase } from './db.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import userDataRoutes from './routes/userDataRoutes.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import coinRoutes from './routes/coinRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { env, validateEnv } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

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
} from './controllers/coinController.js';

const app = express();
const server = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    methods: ['GET', 'POST'],
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit to 15 attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit to 100 requests per minute
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());
app.use(helmet());

// Apply rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/', apiLimiter);

app.use('/api/profile', profileRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/data', userDataRoutes);

app.get('/api/health', getHealth);
app.get('/api/market', asyncHandler(getMarket));
app.get('/api/markets', asyncHandler(getMarketsPage));
app.get('/api/coins', asyncHandler(getCoins));
app.get('/api/global', asyncHandler(getGlobal));
app.get('/api/trending', asyncHandler(getTrendingCoins));
app.get('/api/insights', asyncHandler(getMarketInsights));
app.get('/api/coins/:id', asyncHandler(getCoin));
app.get('/api/coins/:id/chart', asyncHandler(getChart));
app.get('/', asyncHandler(getCryptoNews));

io.on('connection', (socket) => {
  socket.emit('connected', { service: 'crypto-market-realtime' });
});

setInterval(async () => {
  try {
    const [market, insights] = await Promise.all([getMarkets(30), getInsights()]);
    io.emit('market:update', { market, insights, updatedAt: new Date().toISOString() });
  } catch (error) {
    io.emit('market:error', { message: error.message });
  }
}, env.socketMarketIntervalMs);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

async function startServer(port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('error', onError);
      reject(error);
    };

    server.once('error', onError);
    server.listen(port, () => {
      server.off('error', onError);
      resolve(port);
    });
  });
}

async function startOnAvailablePort(basePort, attempts = 10) {
  for (let offset = 0; offset < attempts; offset += 1) {
    const nextPort = Number(basePort) + offset;

    try {
      const startedPort = await startServer(nextPort);
      console.log(`Crypto Market API running on http://localhost:${startedPort}`);
      return;
    } catch (error) {
      if (error.code !== 'EADDRINUSE' || offset === attempts - 1) {
        throw error;
      }

      console.warn(`Port ${nextPort} is in use, trying ${nextPort + 1}...`);
    }
  }
}

// Validate required environment variables in production and fail early
try {
  validateEnv();
} catch (err) {
  console.error('Environment validation failed:', err.message);
  process.exit(1);
}

startOnAvailablePort(env.port);

connectDatabase();
