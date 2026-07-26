import express from 'express';
import { isDatabaseConnected } from '../db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createOrUpdateUser } from '../controllers/authController.js';
import {
  createWatchlist,
  deleteSavedCoin,
  getPortfolio,
  getSavedCoins,
  getUserWatchlists,
  saveCoin,
  updatePortfolio,
  updateWatchlist,
} from '../controllers/watchlistController.js';

const router = express.Router();

router.use((req, res, next) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({ message: 'MongoDB is not connected. Set MONGODB_URI to enable persistence.' });
  }
  next();
});

router.post('/users', asyncHandler(createOrUpdateUser));
router.get('/users/:userId/watchlists', asyncHandler(getUserWatchlists));
router.post('/users/:userId/watchlists', asyncHandler(createWatchlist));
router.put('/watchlists/:id', asyncHandler(updateWatchlist));
router.get('/users/:userId/portfolio', asyncHandler(getPortfolio));
router.put('/users/:userId/portfolio', asyncHandler(updatePortfolio));
router.get('/users/:userId/saved-coins', asyncHandler(getSavedCoins));
router.post('/users/:userId/saved-coins', asyncHandler(saveCoin));
router.delete('/users/:userId/saved-coins/:coinId', asyncHandler(deleteSavedCoin));

export default router;
