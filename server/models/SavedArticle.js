import mongoose from 'mongoose';

const savedArticleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    articleId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    url: String,
    source: String,
    image: String,
    coinTags: [{ type: String }],
    sentiment: String,
    publishedAt: Date,
  },
  { timestamps: true },
);

savedArticleSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export const SavedArticle = mongoose.models.SavedArticle || mongoose.model('SavedArticle', savedArticleSchema);
