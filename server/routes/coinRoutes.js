import express from 'express';
import { getChartApi, getDetailsApi, getMarketApi, getTrendingApi } from '../controllers/coinController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/trending', asyncHandler(getTrendingApi));
router.get('/market', asyncHandler(getMarketApi));
router.get('/details/:id', asyncHandler(getDetailsApi));
router.get('/chart/:id', asyncHandler(getChartApi));

export default router;
