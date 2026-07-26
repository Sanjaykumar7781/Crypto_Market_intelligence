import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { sendResponse } from '../utils/apiResponse.js';

// Get user profile
export async function getUserProfile(req, res) {
  const userId = req.user?._id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const user = await User.findById(userId).select('-passwordHash');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  sendResponse(res, 200, 'Profile retrieved successfully', user);
}

// Update user profile
export async function updateUserProfile(req, res) {
  const userId = req.user?._id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const { name, age, phone, avatarUrl } = req.body;

  // Validate input
  if (name !== undefined && typeof name !== 'string') {
    throw new ApiError(400, 'Invalid name provided');
  }

  if (age !== undefined && typeof age !== 'number' && isNaN(Number(age))) {
    throw new ApiError(400, 'Invalid age provided');
  }

  if (phone !== undefined && typeof phone !== 'string') {
    throw new ApiError(400, 'Invalid phone number provided');
  }

  if (avatarUrl !== undefined && typeof avatarUrl !== 'string') {
    throw new ApiError(400, 'Invalid avatar URL provided');
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (age !== undefined) updateData.age = Number(age);
  if (phone !== undefined) updateData.phone = phone.trim();
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { returnDocument: 'after', runValidators: true },
  ).select('-passwordHash');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  sendResponse(res, 200, 'Profile updated successfully', user);
}

// Delete user account
export async function deleteUserAccount(req, res) {
  const userId = req.user?._id;
  
  if (!userId) {
    throw new ApiError(401, 'User not authenticated');
  }

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  sendResponse(res, 200, 'Account deleted successfully', { message: 'Your account has been deleted' });
}
