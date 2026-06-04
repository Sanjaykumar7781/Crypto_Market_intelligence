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

const coingecko = axios.create({
  baseURL: process.env.COINGECKO_API_BASE || 'https://api.coingecko.com/api/v3',
  timeout: 9000,
});

const rangeDays = {
  '1H': 1,
  '1D': 1,
  '24H': 1,
  '7D': 7,
  '1M': 30,
  '1Y': 365,
};

const sortMap = {
  market_cap_desc: 'market_cap_desc',
  market_cap_asc: 'market_cap_asc',
  volume_desc: 'volume_desc',
  volume_asc: 'volume_asc',
  id_asc: 'id_asc',
  id_desc: 'id_desc',
};

export async function getMarkets(limit = 80) {
  const result = await getMarketPage({ page: 1, perPage: limit });
  return result.data;
}

export async function getMarketPage(options = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const perPage = Math.min(250, Math.max(10, Number(options.perPage || options.limit || 100)));
  const query = String(options.search || '').trim();
  const sort = sortMap[options.sort] || 'market_cap_desc';
  const category = options.category || 'all';
  const priceMin = Number(options.priceMin || 0);
  const priceMax = Number(options.priceMax || 0);
  const selectedCurrency = normalizeCurrency(options.currency);
  const cacheKey = `market:${selectedCurrency}:${page}:${perPage}:${query}:${sort}:${category}:${priceMin}:${priceMax}`;

  return cached(cacheKey, 45_000, async () => {
    try {
      const params = {
        vs_currency: selectedCurrency,
        order: sort,
        per_page: perPage,
        page,
        sparkline: true,
        price_change_percentage: '1h,24h,7d',
      };

      if (query) {
        const ids = await searchCoinIds(query);
        if (!ids.length) {
          return emptyMarketPage(page, perPage);
        }
        params.ids = ids.slice((page - 1) * perPage, page * perPage).join(',');
        params.page = 1;
      }

      const { data } = await coingecko.get('/coins/markets', { params });
      let coins = data.map((coin) => mapMarketCoin(coin, selectedCurrency));

      if (category === 'gainers') coins = coins.filter((coin) => coin.change24h > 0).sort((a, b) => b.change24h - a.change24h);
      if (category === 'losers') coins = coins.filter((coin) => coin.change24h < 0).sort((a, b) => a.change24h - b.change24h);
      if (category === 'large') coins = coins.filter((coin) => coin.marketCap > 10_000_000_000);
      if (category === 'mid') coins = coins.filter((coin) => coin.marketCap <= 10_000_000_000 && coin.marketCap > 1_000_000_000);
      if (category === 'small') coins = coins.filter((coin) => coin.marketCap <= 1_000_000_000);
      if (priceMin) coins = coins.filter((coin) => coin.currentPrice >= priceMin);
      if (priceMax) coins = coins.filter((coin) => coin.currentPrice <= priceMax);

      const total = query ? (await searchCoinIds(query)).length : await getCoinCount();
      return {
        data: coins,
        pagination: {
          page,
          perPage,
          total,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
          hasNextPage: page * perPage < total,
        },
      };
    } catch {
      const filtered = fallbackMarkets.filter((coin) => !query || `${coin.name} ${coin.symbol}`.toLowerCase().includes(query.toLowerCase()));
      return {
        data: filtered.slice((page - 1) * perPage, page * perPage),
        pagination: { page, perPage, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / perPage)), hasNextPage: false },
      };
    }
  });
}

async function searchCoinIds(query) {
  return cached(`search:${query.toLowerCase()}`, 5 * 60_000, async () => {
    const { data } = await coingecko.get('/search', { params: { query } });
    return data.coins.map((coin) => coin.id);
  });
}

async function getCoinCount() {
  return cached('coin-count', 60 * 60_000, async () => {
    try {
      const { data } = await coingecko.get('/coins/list');
      return data.length;
    } catch {
      return fallbackMarkets.length;
    }
  });
}

function emptyMarketPage(page, perPage) {
  return {
    data: [],
    pagination: { page, perPage, total: 0, totalPages: 1, hasNextPage: false },
  };
}

export async function getAllCoinList() {
  return cached('coins:list', 60 * 60_000, async () => {
    try {
      const { data } = await coingecko.get('/coins/list', { params: { include_platform: false } });
      return data;
    } catch {
      return fallbackMarkets.map(({ id, name, symbol }) => ({ id, name, symbol: symbol.toLowerCase() }));
    }
  });
}

export async function getInsights(currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  const cacheKey = `market-insights:v3:${selectedCurrency}`;
  const now = new Date();

  if (isDatabaseConnected()) {
    const cachedDoc = await InsightsCache.findOne({ key: cacheKey, expiresAt: { $gt: now } }).lean();
    if (cachedDoc) return cachedDoc.payload;
  }

  const payload = await cached(cacheKey, 60_000, async () => {
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
      { key: cacheKey, payload, expiresAt: new Date(Date.now() + 60_000) },
      { upsert: true, returnDocument: 'after' },
    );
  }

  return payload;
}

function buildInsights(coins, trending, global) {
  const safeCoins = coins.length ? coins : fallbackMarkets;
  const gainers = [...safeCoins].sort((a, b) => b.change24h - a.change24h).slice(0, 8);
  const losers = [...safeCoins].sort((a, b) => a.change24h - b.change24h).slice(0, 8);
  const bullishCount = safeCoins.filter((coin) => coin.change24h > 0).length;
  const bearishCount = safeCoins.filter((coin) => coin.change24h < 0).length;
  const totalVolume = safeCoins.reduce((sum, coin) => sum + (coin.volume || 0), 0);
  const averageChange = safeCoins.reduce((sum, coin) => sum + (coin.change24h || 0), 0) / safeCoins.length;
  const stablecoins = ['USDT', 'USDC', 'FDUSD', 'DAI', 'USDD', 'TUSD', 'USDE'];
  const volumeLeaders = [...safeCoins]
    .filter(coin => !stablecoins.includes(coin.symbol))
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 8);
  const highMomentum = safeCoins.filter((coin) => coin.change24h > 5 && coin.change7d > 0).slice(0, 8);
  const weakMomentum = safeCoins.filter((coin) => coin.change24h < -5 && coin.change7d < 0).slice(0, 8);
  const benchmark = safeCoins[0] || fallbackMarkets[0];
  const support = benchmark.currentPrice * 0.96;
  const resistance = benchmark.currentPrice * 1.05;
  const trendLabel = averageChange >= 1 ? 'Bullish expansion' : averageChange <= -1 ? 'Bearish pressure' : 'Mixed consolidation';
  const sentimentScore = Math.round((bullishCount / safeCoins.length) * 100);

  return {
    updatedAt: new Date().toISOString(),
    summary: `${trendLabel}: ${bullishCount} of ${safeCoins.length} tracked large-cap and liquid assets are positive over 24h. Volume is ${totalVolume > (global.volume || 0) * 0.45 ? 'concentrated in majors' : 'distributed across the board'}, with ${benchmark.name} setting near-term support around ${formatUsd(support)} and resistance around ${formatUsd(resistance)}.`,
    trend: {
      label: trendLabel,
      averageChange,
      bullishCount,
      bearishCount,
      sentimentScore,
    },
    supportResistance: {
      asset: benchmark.name,
      support,
      resistance,
      pivot: benchmark.currentPrice,
    },
    volume: {
      totalVolume,
      leaders: volumeLeaders,
      volumeToMarketCap: global.marketCap ? (global.volume / global.marketCap) * 100 : 0,
    },
    movers: {
      gainers,
      losers,
      highMomentum,
      weakMomentum,
    },
    trending,
    cards: [
      { label: 'Market Bias', value: trendLabel, detail: `${sentimentScore}% bullish breadth` },
      { label: 'Volume Heat', value: formatUsd(totalVolume), detail: 'Top 250 asset turnover' },
      { label: 'Risk Zone', value: averageChange >= 0 ? 'Constructive' : 'Defensive', detail: `${formatPercent(averageChange)} avg 24h` },
      { label: 'BTC Levels', value: `${formatUsd(support)} / ${formatUsd(resistance)}`, detail: 'Support / resistance' },
    ],
  };
}

function formatUsd(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value || 0);
}

function formatPercent(value) {
  return `${value > 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
}

export async function getGlobalStats(currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  try {
    const { data } = await coingecko.get('/global');
    const global = data.data;
    return {
      currency: selectedCurrency,
      marketCap: global.total_market_cap[selectedCurrency] || global.total_market_cap.usd,
      volume: global.total_volume[selectedCurrency] || global.total_volume.usd,
      btcDominance: global.market_cap_percentage.btc,
      ethDominance: global.market_cap_percentage.eth,
      activeCryptos: global.active_cryptocurrencies,
      markets: global.markets,
      change24h: global[`market_cap_change_percentage_24h_${selectedCurrency}`] || global.market_cap_change_percentage_24h_usd,
      fearGreed: 68,
    };
  } catch {
    return fallbackGlobal;
  }
}

export async function getTrending() {
  try {
    const { data } = await coingecko.get('/search/trending');
    return data.coins.slice(0, 8).map(({ item }) => ({
      id: item.id,
      name: item.name,
      symbol: item.symbol,
      image: item.small,
      marketCapRank: item.market_cap_rank,
      score: item.score,
    }));
  } catch {
    return fallbackTrending;
  }
}

export async function getCoinDetails(id, currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  try {
    const { data } = await coingecko.get(`/coins/${id}`, {
      params: {
        localization: false,
        tickers: true,
        market_data: true,
        community_data: true,
        developer_data: true,
        sparkline: true,
      },
    });

    const website = data.links?.homepage?.find((url) => typeof url === 'string' && url.startsWith('http')) || null;
    const explorers = (data.links?.blockchain_site || []).filter((url) => typeof url === 'string' && url.startsWith('http'));

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      image: data.image?.large,
      description: data.description?.en?.replace(/<[^>]*>?/gm, '').trim(),
      website,
      explorers,
      categories: data.categories || [],
      hashingAlgorithm: data.hashing_algorithm,
      genesisDate: data.genesis_date,
      currency: selectedCurrency,
      currentPrice: data.market_data.current_price[selectedCurrency] || data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap[selectedCurrency] || data.market_data.market_cap.usd,
      volume: data.market_data.total_volume[selectedCurrency] || data.market_data.total_volume.usd,
      high24h: data.market_data.high_24h[selectedCurrency] || data.market_data.high_24h.usd,
      low24h: data.market_data.low_24h[selectedCurrency] || data.market_data.low_24h.usd,
      change1h: data.market_data.price_change_percentage_1h_in_currency?.[selectedCurrency] ?? data.market_data.price_change_percentage_1h_in_currency?.usd ?? 0,
      change24h: data.market_data.price_change_percentage_24h_in_currency?.[selectedCurrency] ?? data.market_data.price_change_percentage_24h ?? 0,
      change7d: data.market_data.price_change_percentage_7d_in_currency?.[selectedCurrency] ?? 0,
      change30d: data.market_data.price_change_percentage_30d_in_currency?.[selectedCurrency] ?? 0,
      change1y: data.market_data.price_change_percentage_1y_in_currency?.[selectedCurrency] ?? 0,
      marketCapRank: data.market_cap_rank,
      fullyDilutedValuation: data.market_data.fully_diluted_valuation?.[selectedCurrency] || null,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      maxSupply: data.market_data.max_supply,
      ath: data.market_data.ath?.[selectedCurrency] || data.market_data.ath?.usd || 0,
      athChangePercentage: data.market_data.ath_change_percentage?.[selectedCurrency] || data.market_data.ath_change_percentage?.usd || 0,
      atl: data.market_data.atl?.[selectedCurrency] || data.market_data.atl?.usd || 0,
      atlChangePercentage: data.market_data.atl_change_percentage?.[selectedCurrency] || data.market_data.atl_change_percentage?.usd || 0,
      blockTime: data.block_time_in_minutes || 0,
      developerScore: data.developer_data?.developer_score,
      communityScore: data.community_data?.community_score,
      publicInterestScore: data.community_data?.public_interest_score,
      sentimentUp: data.sentiment_votes_up_percentage,
      sentimentDown: data.sentiment_votes_down_percentage,
      tickers: data.tickers.slice(0, 8).map((ticker) => ({
        exchange: ticker.market.name,
        pair: `${ticker.base}/${ticker.target}`,
        volume: ticker.volume,
        trust: ticker.trust_score,
      })),
    };
  } catch {
    const coin = fallbackMarkets.find((item) => item.id === id) || fallbackMarkets[0];
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

export async function getCoinChart(id, range = '7D', currency = 'usd') {
  const selectedCurrency = normalizeCurrency(currency);
  try {
    const days = rangeDays[range] || 7;
    const { data } = await coingecko.get(`/coins/${id}/market_chart`, {
        params: { vs_currency: selectedCurrency, days },
    });
    return data.prices.map(([timestamp, price], index) => ({
      time: new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: days <= 1 ? 'numeric' : undefined,
      }),
      price,
      volume: data.total_volumes[index]?.[1] || 0,
    }));
  } catch {
    return fallbackChart;
  }
}

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
    } catch {
      return filterNews(category, search);
    }
  }
  return filterNews(category, search);
}

function filterNews(category, search) {
  const query = search.toLowerCase();
  return fallbackNews
    .filter((item) => category === 'crypto' || item.category.toLowerCase().includes(category.toLowerCase()))
    .filter((item) => !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
}

function mapMarketCoin(coin, currency = 'usd') {
  return {
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    image: coin.image,
    currency,
    currentPrice: coin.current_price,
    change1h: coin.price_change_percentage_1h_in_currency,
    change24h: coin.price_change_percentage_24h,
    change7d: coin.price_change_percentage_7d_in_currency,
    marketCap: coin.market_cap,
    volume: coin.total_volume,
    rank: coin.market_cap_rank,
    circulatingSupply: coin.circulating_supply,
    sparkline: coin.sparkline_in_7d?.price || [],
  };
}

export { fallbackArticles };
