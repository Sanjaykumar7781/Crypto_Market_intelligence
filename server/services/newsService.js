import axios from 'axios';
import Parser from 'rss-parser';
import { isDatabaseConnected } from '../db.js';
import { CachedNews } from '../models/CachedNews.js';
import { cached } from '../utils/cache.js';
import { fallbackNews } from './fallbackData.js';

const parser = new Parser();
const positiveWords = ['surge', 'rally', 'bull', 'record', 'approve', 'growth', 'gain', 'breakout', 'adoption', 'inflow'];
const negativeWords = ['hack', 'lawsuit', 'crash', 'bear', 'plunge', 'outflow', 'ban', 'exploit', 'liquidation', 'fraud'];
const coinDictionary = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'xrp', 'bnb', 'dogecoin', 'doge', 'cardano', 'ada', 'chainlink', 'link'];

export async function getLiveNews(options = {}) {
  const category = String(options.category || 'crypto').toLowerCase();
  const search = String(options.search || '').toLowerCase();
  const coin = String(options.coin || '').toLowerCase();
  const last24h = options.last24h === true || options.last24h === 'true';
  const cacheKey = `news:${category}:${search}:${coin}:${last24h}`;

  if (isDatabaseConnected()) {
    const hit = await CachedNews.findOne({ cacheKey, expiresAt: { $gt: new Date() } }).lean();
    if (hit) return hit.articles;
  }

  const articles = await cached(cacheKey, 90_000, async () => {
    const results = await Promise.allSettled([
      fromCryptoPanic(),
      fromNewsApi(search || coin || 'cryptocurrency'),
      fromCoinTelegraph(),
      fromCoinDesk(),
    ]);

    const merged = results
      .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
      .concat(fallbackNews.map(normalizeFallback))
      .map(enrichArticle)
      .filter(uniqueByUrl);

    return filterArticles(merged, { category, search, coin, last24h }).slice(0, 48);
  });

  if (isDatabaseConnected()) {
    await CachedNews.findOneAndUpdate(
      { cacheKey },
      { cacheKey, articles, expiresAt: new Date(Date.now() + 90_000) },
      { upsert: true },
    );
  }

  return articles;
}

export async function getCoinNews(coinId, symbol = '') {
  const [live, last24h] = await Promise.all([
    getLiveNews({ coin: coinId }),
    getLiveNews({ coin: coinId || symbol, last24h: true }),
  ]);

  const sentimentScore = live.reduce((score, article) => score + (article.sentiment === 'bullish' ? 1 : article.sentiment === 'bearish' ? -1 : 0), 0);
  const bias = sentimentScore > 1 ? 'bullish' : sentimentScore < -1 ? 'bearish' : 'neutral';

  return {
    live,
    last24h,
    sentiment: {
      bias,
      score: sentimentScore,
      summary: `${coinId} news flow is ${bias}. ${last24h.length} relevant updates were detected in the last 24 hours.`,
    },
  };
}

async function fromCryptoPanic() {
  if (!process.env.CRYPTOPANIC_API_KEY) return [];
  const { data } = await axios.get('https://cryptopanic.com/api/v1/posts/', {
    timeout: 8000,
    params: { auth_token: process.env.CRYPTOPANIC_API_KEY, public: true, kind: 'news' },
  });
  return (data.results || []).map((item) => ({
    id: `cryptopanic-${item.id}`,
    title: item.title,
    description: item.title,
    source: item.source?.title || 'CryptoPanic',
    image: item.metadata?.image,
    publishedAt: item.published_at,
    url: item.url,
    category: 'crypto',
  }));
}

async function fromNewsApi(query) {
  if (!process.env.NEWS_API_KEY) return [];
  const { data } = await axios.get('https://newsapi.org/v2/everything', {
    timeout: 8000,
    params: {
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 20,
      apiKey: process.env.NEWS_API_KEY,
      domains: 'coindesk.com,cointelegraph.com,decrypt.co,theblock.co',
    },
  });
  return (data.articles || []).map((item, index) => ({
    id: `newsapi-${index}-${item.publishedAt}`,
    title: item.title,
    description: item.description || item.content || item.title,
    source: item.source?.name || 'NewsAPI',
    image: item.urlToImage,
    publishedAt: item.publishedAt,
    url: item.url,
    category: 'crypto',
  }));
}

async function fromCoinTelegraph() {
  const feed = await parser.parseURL('https://cointelegraph.com/rss');
  return feed.items.slice(0, 20).map((item) => ({
    id: `cointelegraph-${item.guid || item.link}`,
    title: item.title,
    description: item.contentSnippet || item.title,
    source: 'CoinTelegraph',
    image: item.enclosure?.url,
    publishedAt: item.isoDate || item.pubDate,
    url: item.link,
    category: 'blockchain',
  }));
}

async function fromCoinDesk() {
  const feed = await parser.parseURL('https://www.coindesk.com/arc/outboundfeeds/rss/');
  return feed.items.slice(0, 20).map((item) => ({
    id: `coindesk-${item.guid || item.link}`,
    title: item.title,
    description: item.contentSnippet || item.title,
    source: 'CoinDesk',
    image: item.enclosure?.url,
    publishedAt: item.isoDate || item.pubDate,
    url: item.link,
    category: 'crypto',
  }));
}

function normalizeFallback(item) {
  return {
    ...item,
    source: item.source || 'Crypto Market Desk',
  };
}

function enrichArticle(article) {
  const title = article.title || 'Untitled market update';
  const description = article.description || title;
  const text = `${title} ${description}`.toLowerCase();
  const positive = positiveWords.some((word) => text.includes(word));
  const negative = negativeWords.some((word) => text.includes(word));
  const coinTags = coinDictionary.filter((coin) => text.includes(coin)).map((coin) => coin.toUpperCase()).slice(0, 5);

  return {
    id: article.id || article.url || title,
    title,
    description: description.slice(0, 220),
    source: article.source || 'Crypto Market',
    image: article.image || 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=900&q=80',
    publishedAt: article.publishedAt || new Date().toISOString(),
    url: article.url || '#',
    category: article.category || 'crypto',
    coinTags: coinTags.length ? coinTags : ['CRYPTO'],
    sentiment: positive && !negative ? 'bullish' : negative && !positive ? 'bearish' : 'neutral',
    breaking: Date.now() - new Date(article.publishedAt || Date.now()).getTime() < 2 * 60 * 60 * 1000,
  };
}

function filterArticles(articles, { category, search, coin, last24h }) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return articles
    .filter((article) => category === 'crypto' || article.category?.toLowerCase().includes(category))
    .filter((article) => !search || `${article.title} ${article.description}`.toLowerCase().includes(search))
    .filter((article) => !coin || `${article.title} ${article.description} ${article.coinTags.join(' ')}`.toLowerCase().includes(coin))
    .filter((article) => !last24h || new Date(article.publishedAt).getTime() >= since)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

function uniqueByUrl(article, index, articles) {
  return articles.findIndex((item) => item.url === article.url || item.title === article.title) === index;
}
