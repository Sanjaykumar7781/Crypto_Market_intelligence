import express from 'express';
import { getProfile, login, signup } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', asyncHandler(signup));
router.post('/register', asyncHandler(signup));
router.post('/login', asyncHandler(login));
router.get('/profile', protect, asyncHandler(getProfile));

export default router;
