import express from 'express';
import { addToWatchlist, getCurrentWatchlist, getWatchlistByUser, removeFromWatchlist } from '../controllers/watchlistController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', protect, asyncHandler(addToWatchlist));
router.delete('/remove/:coinId', protect, asyncHandler(removeFromWatchlist));
router.get('/', protect, asyncHandler(getCurrentWatchlist));
router.get('/user/:userId', protect, asyncHandler(getWatchlistByUser));

export default router;
