import mongoose from 'mongoose';

const coinAnalyticsSchema = new mongoose.Schema(
  {
    coinId: { type: String, required: true, index: true },
    currency: { type: String, default: 'usd', index: true },
    price: Number,
    marketCap: Number,
    volume: Number,
    change24h: Number,
    change7d: Number,
    sentiment: String,
    whaleActivity: String,
    support: Number,
    resistance: Number,
    newsCount24h: { type: Number, default: 0 },
  },
  { timestamps: true },
);

coinAnalyticsSchema.index({ coinId: 1, currency: 1, createdAt: -1 });

export const CoinAnalytics = mongoose.models.CoinAnalytics || mongoose.model('CoinAnalytics', coinAnalyticsSchema);
