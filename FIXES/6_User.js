import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 100,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    phone: {
      type: String,
      trim: true,
      required: true,
      match: /^[\d\s\-+()]{7,20}$/, // Basic phone format validation
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /.+@.+\..+/,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 60, // bcrypt hash is 60 chars
    },
    provider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Compound index for efficient queries
userSchema.index({ email: 1, createdAt: -1 });

// TTL index - automatically remove inactive users after 90 days (optional)
// userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
