import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} from '../controllers/profileController.js';

const router = Router();

// Protect all profile routes with auth middleware
router.use(protect);

// Get user profile
router.get('/', asyncHandler(getUserProfile));

// Update user profile
router.put('/', asyncHandler(updateUserProfile));

// Delete user account
router.delete('/', asyncHandler(deleteUserAccount));

export default router;
