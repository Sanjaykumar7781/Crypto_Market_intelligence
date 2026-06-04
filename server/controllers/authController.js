import bcrypt from 'bcryptjs';
import { isDatabaseConnected } from '../db.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { generateToken } from '../utils/generateToken.js';

function toAuthResponse(user) {
  return {
    user: {
      id: user._id,
      name: user.name,
      age: user.age,
      phone: user.phone,
      email: user.email,
      provider: user.provider,
      avatarUrl: user.avatarUrl,
    },
    token: generateToken(user),
  };
}

function ensureDatabase(message = 'MongoDB is not connected. Set MONGODB_URI to enable authentication.') {
  if (!isDatabaseConnected()) {
    throw new ApiError(503, message);
  }
}

export async function createOrUpdateUser(req, res) {
  ensureDatabase('MongoDB is not connected. Set MONGODB_URI to enable persistence.');

  const user = await User.findOneAndUpdate(
    { email: req.body.email },
    { $setOnInsert: req.body },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );
  res.status(201).json(user);
}

export async function signup(req, res) {
  ensureDatabase();
  const { name, age, phone, email, password, avatarUrl } = req.body;

  if (!name || !email || !password || !phone) {
    throw new ApiError(400, 'Name, email, password, and phone number are required.');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    age: age !== undefined ? Number(age) : undefined,
    phone: phone.trim(),
    email,
    passwordHash,
    avatarUrl,
    provider: 'email',
  });

  sendResponse(res, 201, 'Signup successful.', toAuthResponse(user));
}

export async function register(req, res) {
  return signup(req, res);
}

export async function login(req, res) {
  ensureDatabase();
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  sendResponse(res, 200, 'Login successful.', toAuthResponse(user));
}

export async function getProfile(req, res) {
  sendResponse(res, 200, 'Profile fetched successfully.', { user: req.user });
}
