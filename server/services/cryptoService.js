import axios from 'axios';
import {
  fallbackArticles,
  fallbackChart,
  fallbackGlobal,
  fallbackMarkets,
  fallbackNews,
  fallbackTrending,
} from './fallbackData.js';
import { isDatabaseConnected } from '../db.js';
import { InsightsCache } from '../models/InsightsCache.js';
import { cached } from '../utils/cache.js';
import { normalizeCurrency } from './currencyService.js';

/* -------------------------------------------------------
   CoinMarketCap API client
   – Free tier: 10 000+ credits / month, 30 req / min
   – Get a free key at https://coinmarketcap.com/api/
------------------------------------------------------- */
const cmc = axios.create({
  baseURL: 'https://pro-api.coinmarketcap.com',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

// Inject the API key on EVERY request (reads env lazily so dotenvx/dotenv
// always has time to load before the first real HTTP call).
cmc.interceptors.request.use((config) => {
  const key = process.env.CMC_API_KEY || '';
  if (key) config.headers['X-CMC_PRO_API_KEY'] = key;
  return config;
});

// Startup diagnostics
setTimeout(() => {
  const key = process.env.CMC_API_KEY;
  if (key) {
    console.log(`[CoinMarketCap] API key configured ✓ (${key.slice(0, 8)}…)`);
  } else {
    console.warn('[CoinMarketCap] ⚠️  No API key set. Add CMC_API_KEY to .env (free at https://coinmarketcap.com/api/)');
  }
}, 0);

/** Retry once on 429 rate-limit. */
async function cmcGet(url, config = {}) {
  try {
    return await cmc.get(url, config);
  } catch (err) {
    if (err.response?.status === 429) {
      const wait = Number(err.response.headers['retry-after'] || 5);
      console.warn(`[CoinMarketCap] 429 on ${url} — retrying in ${wait}s`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      return cmc.get(url, config);
    }
    throw err;
  }
}

/* -------------------------------------------------------
   Sort / range helpers
------------------------------------------------------- */
const cmcSortMap = {
  market_cap_desc: { sort: 'market_cap', sort_dir: 'desc' },
  market_cap_asc: { sort: 'market_cap', sort_dir: 'asc' },
  volume_desc: { sort: 'volume_24h', sort_dir: 'desc' },
  volume_asc: { sort: 'volume_24h', sort_dir: 'asc' },
  id_asc: { sort: 'name', sort_dir: 'asc' },
  id_desc: { sort: 'name', sort_dir: 'desc' },
};

const rangeDays = { '1H': 1, '1D': 1, '24H': 1, '7D': 7, '1M': 30, '1Y': 365 };

/* -------------------------------------------------------
   Static fallback exchange rates (USD base) for offline use
------------------------------------------------------- */
const staticRates = {
  usd: 1, inr: 83.5, eur: 0.92, gbp: 0.79, aed: 3.67,
  sgd: 1.35, jpy: 149.5, cad: 1.36, aud: 1.53, chf: 0.88,
  cny: 7.24, hkd: 7.82, krw: 1330, brl: 4.97, mxn: 17.15,
  zar: 18.6, nzd: 1.63, sek: 10.45, nok: 10.55, dkk: 6.87,
  pln: 3.98, try: 32.4, thb: 35.2, idr: 15700, myr: 4.72,
  php: 56.2, vnd: 25300, sar: 3.75, ils: 3.65, ngn: 1550,
};

function convertFallbackCurrency(coins, targetCurrency) {
  if (targetCurrency === 'usd') return coins;
  const rate = staticRates[targetCurrency] || 1;
  return coins.map((c) => ({
    ...c,
    currency: targetCurrency,
    currentPrice: c.currentPrice * rate,
    marketCap: c.marketCap * rate,
    volume: c.volume * rate,
    sparkline: c.sparkline?.map((p) => p * rate) || [],
  }));
}

/* -------------------------------------------------------
   Slug ↔ CMC numeric-ID mapping (cached 24 h)
------------------------------------------------------- */
async function getSlugMap() {
  return cached('cmc:slug-map', 24 * 60 * 60_000, async () => {
    try {
      const { data } = await cmcGet('/v1/cryptocurrency/map', {
        params: { listing_status: 'active', limit: 5000, sort: 'cmc_rank' },
      });
      const map = {};
      for (const c of data.data) map[c.slug] = c.id;
      return map;
    } catch (error) {
      console.error('[CoinMarketCap] getSlugMap FAILED:', error.response?.status, error.response?.data?.status || error.message);
      return {};
    }
  });
}

/* -------------------------------------------------------
   mapListingCoin  –  CMC listings → our unified shape
------------------------------------------------------- */
function mapListingCoin(coin, cmcCurrency, internalCurrency) {
  const quote = coin.quote?.[cmcCurrency] || coin.quote?.USD || {};
  return {
    id: coin.slug,
    name: coin.name,
    symbol: coin.symbol,
    image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
    currency: internalCurrency,
    currentPrice: quote.price || 0,
    change1h: quote.percent_change_1h || 0,
    change24h: quote.percent_change_24h || 0,
    change7d: quote.percent_change_7d || 0,
    marketCap: quote.market_cap || 0,
    volume: quote.volume_24h || 0,
    rank: coin.cmc_rank,
    circulatingSupply: coin.circulating_supply || 0,
    sparkline: buildSparkline(quote.price, quote.percent_change_7d, coin.slug),
  };
}

function mapQuoteCoin(coin, cmcCurrency, internalCurrency) {
  // /v2/cryptocurrency/quotes/latest returns the same fields
  return mapListingCoin(coin, cmcCurrency, internalCurrency);
}

/* -------------------------------------------------------
   Deterministic sparkline from % changes
------------------------------------------------------- */
function buildSparkline(price, change7d, slug) {
  if (!price) return [];
  const start = price / (1 + (change7d || 0) / 100);
  const n = 28;
  let seed = hashCode(slug || 'x');
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const trend = start + (price - start) * t;
    const noise = (rng() - 0.5) * Math.abs(price - start) * 0.25;
    return Math.max(0, trend + noise * Math.sin(t * Math.PI * 3));
  });
}

function hashCode(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  return h || 1;
}

/* =======================================================
   PUBLIC API  (same signatures as before)
======================================================= */

export async function getMarkets(limit = 80) {
  const result = await getMarketPage({ page: 1, perPage: limit });
  return result.data;
}

export async function getMarketPage(options = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const perPage = Math.min(250, Math.max(10, Number(options.perPage || options.limit || 100)));
  const query = String(options.search || '').trim();
  const sortKey = options.sort || 'market_cap_desc';
  const category = options.category || 'all';
  const priceMin = Number(options.priceMin || 0);
  const priceMax = Number(options.priceMax || 0);
  const selectedCurrency = normalizeCurrency(options.currency);
  const cmcCurrency = selectedCurrency.toUpperCase();
  const cacheKey = `cmc:market:${cmcCurrency}:${page}:${perPage}:${query}:${sortKey}:${category}:${priceMin}:${priceMax}`;

  return cached(cacheKey, 120_000, async () => {
    try {
      /* ---------- search path ---------- */
      if (query) {
        return await searchMarket(query, page, perPage, selectedCurrency, cmcCurrency, category, priceMin, priceMax);
      }

      /* ---------- normal listing ---------- */
      const sortCfg = cmcSortMap[sortKey] || cmcSortMap.market_cap_desc;
      const start = (page - 1) * perPage + 1;

      const { data } = await cmcGet('/v1/cryptocurrency/listings/latest', {
        params: { start, limit: perPage, convert: cmcCurrency, sort: sortCfg.sort, sort_dir: sortCfg.sort_dir },
      });

      console.log(`[CoinMarketCap] ✓ listings returned ${data.data?.length || 0} coins (currency=${cmcCurrency}, page=${page}, credits=${data.status?.credit_count})`);

      let coins = data.data.map((c) => mapListingCoin(c, cmcCurrency, selectedCurrency));

      if (category === 'gainers') coins = coins.filter((c) => c.change24h > 0).sort((a, b) => b.change24h - a.change24h);
      if (category === 'losers') coins = coins.filter((c) => c.change24h < 0).sort((a, b) => a.change24h - b.change24h);
      if (category === 'large') coins = coins.filter((c) => c.marketCap > 10_000_000_000);
      if (category === 'mid') coins = coins.filter((c) => c.marketCap <= 10_000_000_000 && c.marketCap > 1_000_000_000);
      if (category === 'small') coins = coins.filter((c) => c.marketCap <= 1_000_000_000);
      if (priceMin) coins = coins.filter((c) => c.currentPrice >= priceMin);
      if (priceMax) coins = coins.filter((c) => c.currentPrice <= priceMax);

      const total = data.status?.total_count || (await getCoinCount());
      return {
        data: coins,
        pagination: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)), hasNextPage: page * perPage < total },
      };
    } catch (error) {
      console.error('[CoinMarketCap] getMarketPage FAILED:', error.response?.status, error.response?.data?.status || error.message);
      console.error('[CoinMarketCap] ⚠️  Returning fallback data (6 coins).');
      const filtered = fallbackMarkets.filter((c) => !query || `${c.name} ${c.symbol}`.toLowerCase().includes(query.toLowerCase()));
      return {
        data: convertFallbackCurrency(filtered.slice((page - 1) * perPage, page * perPage), selectedCurrency),
        pagination: { page, perPage, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / perPage)), hasNextPage: false },
      };
    }
  });
}

/* ---------- search helper ---------- */
async function searchMarket(query, page, perPage, selectedCurrency, cmcCurrency, category, priceMin, priceMax) {
  const allCoins = await getAllCoinList();
  const lq = query.toLowerCase();
  const matches = allCoins.filter((c) => c.name.toLowerCase().includes(lq) || c.symbol.toLowerCase().includes(lq));

  if (!matches.length) return emptyMarketPage(page, perPage);

  const pageSlice = matches.slice((page - 1) * perPage, page * perPage);
  const ids = pageSlice.map((c) => c.cmcId).filter(Boolean).join(',');

  if (!ids) return emptyMarketPage(page, perPage);

  try {
    const { data } = await cmcGet('/v2/cryptocurrency/quotes/latest', {
      params: { id: ids, convert: cmcCurrency },
    });
    let coins = Object.values(data.data).map((c) => mapQuoteCoin(c, cmcCurrency, selectedCurrency));

    if (category === 'gainers') coins = coins.filter((c) => c.change24h > 0).sort((a, b) => b.change24h - a.change24h);
    if (category === 'losers') coins = coins.filter((c) => c.change24h < 0).sort((a, b) => a.change24h - b.change24h);
    if (priceMin) coins = coins.filter((c) => c.currentPrice >= priceMin);
    if (priceMax) coins = coins.filter((c) => c.currentPrice <= priceMax);

    return {
      data: coins,
      pagination: { page, perPage, total: matches.length, totalPages: Math.max(1, Math.ceil(matches.length / perPage)), hasNextPage: page * perPage < matches.length },
    };
  } catch (error) {
    console.error('[CoinMarketCap] searchMarket FAILED:', error.response?.status, error.response?.data?.status || error.message);
    return emptyMarketPage(page, perPage);
  }
}

async function getCoinCount() {
  return cached('cmc:coin-count', 24 * 60 * 60_000, async () => {
    try {
      const { data } = await cmcGet('/v1/cryptocurrency/map', { params: { listing_status: 'active', limit: 1 } });
      return data.status?.total_count || 10000;
    } catch (error) {
      console.error('[CoinMarketCap] getCoinCount FAILED:', error.response?.status, error.response?.data?.status || error.message);
      return fallbackMarkets.length;
    }
  });
}

function emptyMarketPage(page, perPage) {
  return { data: [], pagination: { page, perPage, total: 0, totalPages: 1, hasNextPage: false } };
}

/* -------------------------------------------------------
   Coin list (for autocomplete / search)
------------------------------------------------------- */
export async function getAllCoinList() {
  return cached('cmc:coins-list', 24 * 60 * 60_000, async () => {
    try {
      const { data } = await cmcGet('/v1/cryptocurrency/map', {
        params: { listing_status: 'active', limit: 5000, sort: 'cmc_rank' },
      });
      return data.data.map((c) => ({ id: c.slug, name: c.name, symbol: c.symbol.toLowerCase(), slug: c.slug, cmcId: c.id }));
    } catch (error) {
      console.error('[CoinMarketCap] getAllCoinList FAILED:', error.response?.status, error.response?.data?.status || error.message);
      return fallbackMarkets.map(({ id, name, symbol }) => ({ id, name, symbol: symbol.toLowerCase() }));
    }
  });
}

/* -------------------------------------------------------
   Insights
------------------------------------------------------- */
export async function getInsights(currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  const cacheKey = `market-insights:v3:${selectedCurrency}`;
  const now = new Date();

  if (isDatabaseConnected()) {
    const cachedDoc = await InsightsCache.findOne({ key: cacheKey, expiresAt: { $gt: now } }).lean();
    if (cachedDoc) return cachedDoc.payload;
  }

  const payload = await cached(cacheKey, 120_000, async () => {
    const [market, trending, global] = await Promise.all([
      getMarketPage({ page: 1, perPage: 250, sort: 'market_cap_desc', currency: selectedCurrency }),
      getTrending(),
      getGlobalStats(selectedCurrency),
    ]);
    return buildInsights(market.data, trending, global);
  });

  if (isDatabaseConnected()) {
    await InsightsCache.findOneAndUpdate(
      { key: cacheKey },
      { key: cacheKey, payload, expiresAt: new Date(Date.now() + 120_000) },
      { upsert: true, returnDocument: 'after' },
    );
  }
  return payload;
}

function buildInsights(coins, trending, global) {
  const safeCoins = coins.length ? coins : fallbackMarkets;
  const gainers = [...safeCoins].sort((a, b) => b.change24h - a.change24h).slice(0, 8);
  const losers = [...safeCoins].sort((a, b) => a.change24h - b.change24h).slice(0, 8);
  const bullishCount = safeCoins.filter((c) => c.change24h > 0).length;
  const bearishCount = safeCoins.filter((c) => c.change24h < 0).length;
  const totalVolume = safeCoins.reduce((s, c) => s + (c.volume || 0), 0);
  const averageChange = safeCoins.reduce((s, c) => s + (c.change24h || 0), 0) / safeCoins.length;
  const stablecoins = ['USDT', 'USDC', 'FDUSD', 'DAI', 'USDD', 'TUSD', 'USDE'];
  const volumeLeaders = [...safeCoins].filter((c) => !stablecoins.includes(c.symbol)).sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 8);
  const highMomentum = safeCoins.filter((c) => c.change24h > 5 && c.change7d > 0).slice(0, 8);
  const weakMomentum = safeCoins.filter((c) => c.change24h < -5 && c.change7d < 0).slice(0, 8);
  const benchmark = safeCoins[0] || fallbackMarkets[0];
  const support = benchmark.currentPrice * 0.96;
  const resistance = benchmark.currentPrice * 1.05;
  const trendLabel = averageChange >= 1 ? 'Bullish expansion' : averageChange <= -1 ? 'Bearish pressure' : 'Mixed consolidation';
  const sentimentScore = Math.round((bullishCount / safeCoins.length) * 100);

  return {
    updatedAt: new Date().toISOString(),
    summary: `${trendLabel}: ${bullishCount} of ${safeCoins.length} tracked large-cap and liquid assets are positive over 24h. Volume is ${totalVolume > (global.volume || 0) * 0.45 ? 'concentrated in majors' : 'distributed across the board'}, with ${benchmark.name} setting near-term support around ${fmtUsd(support)} and resistance around ${fmtUsd(resistance)}.`,
    trend: { label: trendLabel, averageChange, bullishCount, bearishCount, sentimentScore },
    supportResistance: { asset: benchmark.name, support, resistance, pivot: benchmark.currentPrice },
    volume: { totalVolume, leaders: volumeLeaders, volumeToMarketCap: global.marketCap ? (global.volume / global.marketCap) * 100 : 0 },
    movers: { gainers, losers, highMomentum, weakMomentum },
    trending,
    cards: [
      { label: 'Market Bias', value: trendLabel, detail: `${sentimentScore}% bullish breadth` },
      { label: 'Volume Heat', value: fmtUsd(totalVolume), detail: 'Top 250 asset turnover' },
      { label: 'Risk Zone', value: averageChange >= 0 ? 'Constructive' : 'Defensive', detail: `${fmtPercent(averageChange)} avg 24h` },
      { label: 'BTC Levels', value: `${fmtUsd(support)} / ${fmtUsd(resistance)}`, detail: 'Support / resistance' },
    ],
  };
}

function fmtUsd(v) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(v || 0); }
function fmtPercent(v) { return `${v > 0 ? '+' : ''}${(v || 0).toFixed(2)}%`; }

/* -------------------------------------------------------
   Global stats
------------------------------------------------------- */
export async function getGlobalStats(currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  const cmcCurrency = selectedCurrency.toUpperCase();
  try {
    const { data } = await cmcGet('/v1/global-metrics/quotes/latest', { params: { convert: cmcCurrency } });
    const g = data.data;
    const q = g.quote?.[cmcCurrency] || g.quote?.USD || {};
    return {
      currency: selectedCurrency,
      marketCap: q.total_market_cap || 0,
      volume: q.total_volume_24h || 0,
      btcDominance: g.btc_dominance || 0,
      ethDominance: g.eth_dominance || 0,
      activeCryptos: g.active_cryptocurrencies || 0,
      markets: g.active_exchanges || 0,
      change24h: q.total_market_cap_yesterday_percentage_change || 0,
      fearGreed: 68,
    };
  } catch (error) {
    console.error('[CoinMarketCap] getGlobalStats FAILED:', error.response?.status, error.response?.data?.status || error.message);
    return fallbackGlobal;
  }
}

/* -------------------------------------------------------
   Trending  (derived from top-ranked coins)
------------------------------------------------------- */
export async function getTrending() {
  try {
    const result = await getMarketPage({ page: 1, perPage: 20, sort: 'market_cap_desc' });
    return result.data.slice(0, 8).map((c, score) => ({
      id: c.id, name: c.name, symbol: c.symbol, image: c.image,
      marketCapRank: c.rank, score,
    }));
  } catch (error) {
    console.error('[CoinMarketCap] getTrending FAILED:', error.response?.status, error.response?.data?.status || error.message);
    return fallbackTrending;
  }
}

/* -------------------------------------------------------
   Coin details  (quotes + info)
------------------------------------------------------- */
export async function getCoinDetails(id, currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  const cmcCurrency = selectedCurrency.toUpperCase();
  try {
    const [quotesRes, infoRes] = await Promise.all([
      cmcGet('/v2/cryptocurrency/quotes/latest', { params: { slug: id, convert: cmcCurrency } }),
      cmcGet('/v2/cryptocurrency/info', { params: { slug: id } }),
    ]);

    const coinData = Object.values(quotesRes.data.data)[0];
    const coinInfo = Object.values(infoRes.data.data)[0];
    const q = coinData.quote?.[cmcCurrency] || coinData.quote?.USD || {};

    const website = coinInfo.urls?.website?.[0] || null;
    const explorers = (coinInfo.urls?.explorer || []).filter(Boolean);

    return {
      id: coinData.slug,
      name: coinData.name,
      symbol: coinData.symbol,
      image: coinInfo.logo || `https://s2.coinmarketcap.com/static/img/coins/128x128/${coinData.id}.png`,
      description: (coinInfo.description || '').replace(/<[^>]*>?/gm, '').trim(),
      website,
      explorers,
      categories: (coinInfo.tags || []).map((t) => (typeof t === 'string' ? t : t.name || t.slug || '')),
      hashingAlgorithm: null,
      genesisDate: coinInfo.date_launched || coinData.date_added?.split('T')[0] || null,
      currency: selectedCurrency,
      currentPrice: q.price || 0,
      marketCap: q.market_cap || 0,
      volume: q.volume_24h || 0,
      high24h: (q.price || 0) * (1 + Math.abs(q.percent_change_24h || 0) / 200),
      low24h: (q.price || 0) * (1 - Math.abs(q.percent_change_24h || 0) / 200),
      change1h: q.percent_change_1h || 0,
      change24h: q.percent_change_24h || 0,
      change7d: q.percent_change_7d || 0,
      change30d: q.percent_change_30d || 0,
      change1y: q.percent_change_90d ? q.percent_change_90d * 4 : 0,
      marketCapRank: coinData.cmc_rank,
      fullyDilutedValuation: q.fully_diluted_market_cap || null,
      circulatingSupply: coinData.circulating_supply,
      totalSupply: coinData.total_supply,
      maxSupply: coinData.max_supply,
      ath: 0,
      athChangePercentage: 0,
      atl: 0,
      atlChangePercentage: 0,
      blockTime: 0,
      developerScore: 0,
      communityScore: 0,
      publicInterestScore: 0,
      sentimentUp: 72,
      sentimentDown: 28,
      tickers: [],
    };
  } catch (error) {
    console.error('[CoinMarketCap] getCoinDetails FAILED for', id, ':', error.response?.status, error.response?.data?.status || error.message);
    const coin = fallbackMarkets.find((c) => c.id === id) || fallbackMarkets[0];
    return {
      ...coin,
      description: `${coin.name} is tracked with live pricing, liquidity, sentiment, supply metrics, and exchange availability inside Crypto Market.`,
      website: null,
      explorers: [],
      categories: [],
      hashingAlgorithm: null,
      genesisDate: null,
      marketCapRank: coin.rank,
      fullyDilutedValuation: null,
      change1h: coin.change1h || 0,
      change24h: coin.change24h || 0,
      change7d: coin.change7d || 0,
      change30d: coin.change30d || 0,
      change1y: coin.change1y || 0,
      circulatingSupply: coin.circulatingSupply || 0,
      totalSupply: coin.totalSupply || 0,
      maxSupply: coin.maxSupply || 0,
      ath: coin.currentPrice * 1.5,
      athChangePercentage: -33.3,
      atl: coin.currentPrice * 0.1,
      atlChangePercentage: 900.0,
      blockTime: 10,
      developerScore: 0,
      communityScore: 0,
      publicInterestScore: 0,
      sentimentUp: coin.sentimentUp || 72,
      sentimentDown: coin.sentimentDown || 28,
      tickers: [
        { exchange: 'Binance', pair: `${coin.symbol}/USDT`, volume: 1220000000, trust: 'green' },
        { exchange: 'Coinbase', pair: `${coin.symbol}/USD`, volume: 680000000, trust: 'green' },
      ],
    };
  }
}

/* -------------------------------------------------------
   Chart  (synthetic — CMC free tier has no historical data)
------------------------------------------------------- */
export async function getCoinChart(id, range = '7D', currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  try {
    const coin = await getCoinDetails(id, selectedCurrency);
    return generateSyntheticChart(coin, range);
  } catch (error) {
    console.error('[CoinMarketCap] getCoinChart FAILED for', id, ':', error.response?.status, error.response?.data?.status || error.message);
    return fallbackChart;
  }
}

function generateSyntheticChart(coin, range) {
  const days = rangeDays[range] || 7;
  let numPoints, changePct;

  if (days <= 1) { numPoints = 24; changePct = coin.change24h || 0; }
  else if (days <= 7) { numPoints = 28; changePct = coin.change7d || 0; }
  else if (days <= 30) { numPoints = 30; changePct = coin.change30d || (coin.change7d || 0) * 4; }
  else { numPoints = 52; changePct = coin.change1y || (coin.change30d || 0) * 12; }

  const price = coin.currentPrice || 0;
  if (!price) return fallbackChart;

  const startPrice = price / (1 + changePct / 100);
  const now = Date.now();
  const step = (days * 86_400_000) / numPoints;
  let seed = hashCode(coin.id || 'x');
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  return Array.from({ length: numPoints }, (_, i) => {
    const t = i / (numPoints - 1);
    const trend = startPrice + (price - startPrice) * t;
    const noise = (rng() - 0.5) * Math.abs(price - startPrice) * 0.3;
    const p = Math.max(0, trend + noise * Math.sin(t * Math.PI * 3));
    const ts = now - (numPoints - 1 - i) * step;
    return {
      time: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: days <= 1 ? 'numeric' : undefined }),
      price: p,
      volume: (coin.volume || 0) / numPoints + (rng() * (coin.volume || 0) * 0.08),
    };
  });
}

/* -------------------------------------------------------
   News (CryptoCompare — unchanged)
------------------------------------------------------- */
export async function getNews(category, search) {
  if (process.env.CRYPTOCOMPARE_API_KEY) {
    try {
      const { data } = await axios.get('https://min-api.cryptocompare.com/data/v2/news/', {
        timeout: 9000,
        params: { lang: 'EN', api_key: process.env.CRYPTOCOMPARE_API_KEY },
      });
      return data.Data.slice(0, 12).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.body.slice(0, 180),
        image: item.imageurl,
        publishedAt: new Date(item.published_on * 1000).toISOString(),
        category: item.categories?.split('|')[0] || category,
        url: item.url,
      }));
    } catch (error) {
      console.error('[CryptoCompare] News fetch FAILED:', error.response?.status, error.response?.data || error.message);
      return filterNews(category, search);
    }
  }
  return filterNews(category, search);
}

function filterNews(category, search) {
  const q = search.toLowerCase();
  return fallbackNews
    .filter((item) => category === 'crypto' || item.category.toLowerCase().includes(category.toLowerCase()))
    .filter((item) => !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
}

export { fallbackArticles };
