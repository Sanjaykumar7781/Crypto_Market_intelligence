import express from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  addPortfolioHolding,
  getPortfolioByUser,
  removePortfolioHolding,
  analyzePortfolio,
  getTradeSignal,
} from '../controllers/portfolioController.js';

const router = express.Router();

// All portfolio routes are protected and operate on the authenticated user
router.use(protect);

// Get current user's portfolio
router.get('/', asyncHandler(getPortfolioByUser));

// Add a holding
router.post('/holdings', asyncHandler(addPortfolioHolding));

// Remove a holding by its holdings._id
router.delete('/holdings/:id', asyncHandler(removePortfolioHolding));

// Analyze portfolio via AI
router.post('/analyze', asyncHandler(analyzePortfolio));

// Generate buy/hold/sell trade signal for the current portfolio
router.post('/signal', asyncHandler(getTradeSignal));

export default router;
