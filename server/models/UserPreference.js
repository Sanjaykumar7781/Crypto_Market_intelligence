import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    currency: { type: String, default: 'usd', lowercase: true },
    theme: { type: String, default: 'dark' },
    newsSources: [{ type: String }],
    notificationSettings: {
      breakingNews: { type: Boolean, default: true },
      priceAlerts: { type: Boolean, default: true },
      whaleAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

userPreferenceSchema.index({ userId: 1 }, { unique: true, sparse: true });

export const UserPreference = mongoose.models.UserPreference || mongoose.model('UserPreference', userPreferenceSchema);
