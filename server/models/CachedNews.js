import mongoose from 'mongoose';

const cachedNewsSchema = new mongoose.Schema(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    articles: { type: [mongoose.Schema.Types.Mixed], default: [] },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const CachedNews = mongoose.models.CachedNews || mongoose.model('CachedNews', cachedNewsSchema);
