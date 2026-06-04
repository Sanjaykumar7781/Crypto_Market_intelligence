import { getLiveNews } from '../services/newsService.js';
import { sendResponse } from '../utils/apiResponse.js';

export async function getLatestNews(req, res) {
  const articles = await getLiveNews({
    category: req.query.category || 'crypto',
    search: req.query.search || '',
    last24h: req.query.last24h,
  });

  sendResponse(res, 200, 'Latest news fetched successfully.', articles);
}

export async function getTrendingNews(req, res) {
  const articles = await getLiveNews({ category: req.query.category || 'crypto' });
  const trending = articles
    .filter((article) => article.breaking || article.sentiment !== 'neutral')
    .slice(0, Number(req.query.limit || 12));

  sendResponse(res, 200, 'Trending news fetched successfully.', trending.length ? trending : articles.slice(0, 12));
}
