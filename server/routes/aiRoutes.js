import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getPortfolioHealth,
  getPortfolioMetricsEndpoint,
  compareCoinsPair,
  quickCompareCoinsPair,
} from '../controllers/aiController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
| All AI routes require a logged-in user
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Portfolio AI
|--------------------------------------------------------------------------
*/

router.get(
  '/portfolio-health',
  asyncHandler(getPortfolioHealth)
);

router.get(
  '/portfolio-metrics',
  asyncHandler(getPortfolioMetricsEndpoint)
);

/*
|--------------------------------------------------------------------------
| Coin Comparison AI
|--------------------------------------------------------------------------
*/

router.post(
  '/compare',
  asyncHandler(compareCoinsPair)
);

router.post(
  '/quick-compare',
  asyncHandler(quickCompareCoinsPair)
);

export default router;