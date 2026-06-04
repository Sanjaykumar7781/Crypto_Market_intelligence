import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { isDatabaseConnected } from '../db.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';

    // Accept 'Bearer <token>' (case-insensitive) or a raw token
    let token = null;
    const match = header.match(/Bearer\s+(.+)/i);
    if (match) token = match[1];
    else if (header && !header.includes(' ')) token = header;

    if (!token) {
      throw new ApiError(401, 'Authentication token is required.');
    }

    if (!isDatabaseConnected()) {
      throw new ApiError(503, 'MongoDB is not connected. Set MONGODB_URI to enable authentication.');
    }

    if (!env.jwtSecret) {
      throw new ApiError(500, 'Server misconfiguration: JWT secret not provided.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Authentication token expired.');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid authentication token.');
      }
      throw err;
    }

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      throw new ApiError(401, 'Authenticated user no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
