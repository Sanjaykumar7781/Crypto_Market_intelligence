import mongoose from 'mongoose';

const insightHistorySchema = new mongoose.Schema(
  {
    scope: { type: String, default: 'global', index: true },
    coinId: { type: String, index: true },
    currency: { type: String, default: 'usd' },
    summary: String,
    trend: mongoose.Schema.Types.Mixed,
    supportResistance: mongoose.Schema.Types.Mixed,
    payload: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const InsightHistory = mongoose.models.InsightHistory || mongoose.model('InsightHistory', insightHistorySchema);
