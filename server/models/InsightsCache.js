
import mongoose from 'mongoose';

const insightsCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  payload: mongoose.Schema.Types.Mixed,
  expiresAt: { type: Date, required: true },
});

// TTL Index - automatically removes after expiry
insightsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InsightsCache = mongoose.models.InsightsCache || mongoose.model('InsightsCache', insightsCacheSchema);
