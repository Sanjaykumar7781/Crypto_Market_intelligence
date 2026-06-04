import mongoose from 'mongoose';

const holdingSchema = new mongoose.Schema(
  {
    coinId: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
      max: 1e10,
      validate: {
        validator: (v) => v >= 0,
        message: 'Amount must be non-negative',
      },
    },
    averageBuyPrice: {
      type: Number,
      default: 0,
      min: 0,
      max: 1e10,
      validate: {
        validator: (v) => v >= 0,
        message: 'Average buy price must be non-negative',
      },
    },
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true },
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    baseCurrency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CNY'],
      default: 'USD',
    },
    holdings: [holdingSchema],
  },
  { timestamps: true },
);

// Unique index on userId to ensure one portfolio per user
portfolioSchema.index({ userId: 1 }, { unique: true });

// Compound index for querying by user and creation time
portfolioSchema.index({ userId: 1, createdAt: -1 });

export const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);
