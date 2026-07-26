import express from 'express';
import { cacheInsight, getCoinInsight } from '../controllers/insightController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/cache', asyncHandler(cacheInsight));
router.get('/:coinId', asyncHandler(getCoinInsight));

export default router;
