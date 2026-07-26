import { CoinAnalytics } from '../models/CoinAnalytics.js';
import { InsightHistory } from '../models/InsightHistory.js';
import { InsightsCache } from '../models/InsightsCache.js';
import { getCoinDetails } from '../services/cryptoService.js';
import { getCoinNews } from '../services/newsService.js';
import { ApiError } from '../utils/apiError.js';
import { sendResponse } from '../utils/apiResponse.js';

export async function getCoinInsight(req, res) {
  const { coinId } = req.params;
  const cacheKey = `coin-insight:${coinId}`;
  
  try {
    const cachedInsight = await InsightsCache.findOne({ key: cacheKey, expiresAt: { $gt: new Date() } }).lean();

    if (cachedInsight) {
      return sendResponse(res, 200, 'Coin insight fetched from cache.', cachedInsight.payload);
    }

    let coin, news;
    try {
      [coin, news] = await Promise.all([getCoinDetails(coinId), getCoinNews(coinId)]);
    } catch (apiError) {
      throw new ApiError(503, `Failed to fetch coin data: ${apiError.message}`);
    }

    if (!coin) {
      throw new ApiError(404, `Coin with ID "${coinId}" not found.`);
    }

    const payload = buildInsightPayload(coin, news);

    await Promise.all([
      InsightsCache.findOneAndUpdate(
        { key: cacheKey },
        { key: cacheKey, payload, expiresAt: new Date(Date.now() + 10 * 60_000) },
        { upsert: true, returnDocument: 'after' },
      ),
      InsightHistory.create({
        scope: 'coin',
        coinId,
        summary: payload.summary,
        trend: payload.trend,
        supportResistance: payload.supportResistance,
        payload,
      }),
      CoinAnalytics.create({
        coinId,
        price: coin.currentPrice,
        marketCap: coin.marketCap,
        volume: coin.volume,
        change24h: coin.change24h,
        change7d: coin.change7d,
        sentiment: payload.sentiment.bias,
        support: payload.supportResistance.support,
        resistance: payload.supportResistance.resistance,
        newsCount24h: news.last24h.length,
      }).catch(err => console.error('Failed to log analytics:', err)),
    ]);

    sendResponse(res, 200, 'Coin insight generated successfully.', payload);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to generate coin insight: ${error.message}`);
  }
}

export async function cacheInsight(req, res) {
  const { key, coinId, payload, ttlSeconds = 600 } = req.body;

  if (!key || !payload) {
    throw new ApiError(400, 'key and payload are required.');
  }

  const cache = await InsightsCache.findOneAndUpdate(
    { key },
    { key, payload, expiresAt: new Date(Date.now() + Number(ttlSeconds) * 1000) },
    { upsert: true, returnDocument: 'after', runValidators: true },
  );

  await InsightHistory.create({
    scope: coinId ? 'coin' : 'global',
    coinId,
    summary: payload.summary,
    trend: payload.trend,
    supportResistance: payload.supportResistance,
    payload,
  });

  sendResponse(res, 201, 'Insight cached successfully.', cache);
}

function buildInsightPayload(coin, news) {
  const change24h = coin.change24h || 0;
  const change7d = coin.change7d || 0;
  
  // Use 24h high/low for support/resistance if available, otherwise use calculated levels
  const support = coin.low24h ? Math.max(coin.low24h, coin.currentPrice * 0.96) : coin.currentPrice * 0.96;
  const resistance = coin.high24h ? Math.min(coin.high24h, coin.currentPrice * 1.05) : coin.currentPrice * 1.05;
  
  const trendLabel = change24h > 3 ? 'bullish momentum' : change24h < -3 ? 'bearish pressure' : 'neutral consolidation';

  return {
    coinId: coin.id,
    generatedAt: new Date().toISOString(),
    summary: `${coin.name} is showing ${trendLabel} with ${news.sentiment.bias} news sentiment and ${news.last24h.length} relevant news updates in the last 24 hours.`,
    trend: {
      label: trendLabel,
      change24h,
      change7d,
      volume: coin.volume || 0,
    },
    supportResistance: {
      support,
      resistance,
      pivot: coin.currentPrice || 0,
    },
    sentiment: news.sentiment,
    risks: [
      change24h < -5 ? 'Short-term price weakness is elevated.' : 'Short-term price action is within normal volatility.',
      news.sentiment.bias === 'bearish' ? 'News sentiment may pressure buyer confidence.' : 'News sentiment is not strongly negative.',
    ],
  };
}
