import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, default: 'Default Watchlist' },
    coins: [
      {
        coinId: { type: String, required: true },
        symbol: String,
        name: String,
        image: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Watchlist = mongoose.models.Watchlist || mongoose.model('Watchlist', watchlistSchema);
