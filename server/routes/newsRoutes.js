import express from 'express';
import { getLatestNews, getTrendingNews } from '../controllers/newsController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/latest', asyncHandler(getLatestNews));
router.get('/trending', asyncHandler(getTrendingNews));

export default router;
