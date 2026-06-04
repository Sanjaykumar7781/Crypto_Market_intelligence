import mongoose from 'mongoose';

const savedCoinSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    coinId: { type: String, required: true, index: true },
    symbol: String,
    name: String,
    image: String,
    tags: [{ type: String }],
    note: String,
  },
  { timestamps: true },
);

savedCoinSchema.index({ userId: 1, coinId: 1 }, { unique: true });

export const SavedCoin = mongoose.models.SavedCoin || mongoose.model('SavedCoin', savedCoinSchema);
