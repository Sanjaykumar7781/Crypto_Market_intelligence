import {
  getAllCoinList,
  getCoinChart,
  getCoinDetails,
  getGlobalStats,
  getInsights,
  getMarketPage,
  getNews,
  getTrending,
  testCmc,
} from '../services/cryptoService.js';
import { isDatabaseConnected } from '../db.js';
import { sendResponse } from '../utils/apiResponse.js';

export function getHealth(_req, res) {
  sendResponse(res, 200, 'Health status OK.', {
    status: 'ok',
    service: 'crypto-market-api',
    database: isDatabaseConnected() ? 'connected' : 'disabled',
  });
}

export async function getMarket(req, res) {
  const limit = Number(req.query.limit || 80);
  const result = await getMarketPage({ page: 1, perPage: limit, currency: req.query.currency });
  sendResponse(res, 200, 'Market data fetched successfully.', result.data);
}

export async function getMarketsPage(req, res) {
  const result = await getMarketPage({
    page: req.query.page,
    perPage: req.query.perPage,
    search: req.query.search,
    sort: req.query.sort,
    category: req.query.category,
    priceMin: req.query.priceMin,
    priceMax: req.query.priceMax,
    currency: req.query.currency,
  });
  sendResponse(res, 200, 'Markets fetched successfully.', result.data, result.pagination);
}

export async function getCoins(_req, res) {
  const coins = await getAllCoinList();
  sendResponse(res, 200, 'All coins fetched successfully.', coins);
}

export async function getGlobal(req, res) {
  const global = await getGlobalStats(req.query.currency);
  sendResponse(res, 200, 'Global stats fetched successfully.', global);
}

export async function getTrendingCoins(_req, res) {
  const trending = await getTrending();
  sendResponse(res, 200, 'Trending coins fetched successfully.', trending);
}

export async function getMarketInsights(req, res) {
  const insights = await getInsights(req.query.currency);
  sendResponse(res, 200, 'Market insights fetched successfully.', insights);
}

export async function getCoin(req, res) {
  const coin = await getCoinDetails(req.params.id, req.query.currency);
  sendResponse(res, 200, 'Coin details fetched successfully.', coin);
}

export async function getChart(req, res) {
  const chart = await getCoinChart(req.params.id, req.query.range || '7D', req.query.currency);
  sendResponse(res, 200, 'Coin chart fetched successfully.', chart);
}

export async function getCryptoNews(req, res) {
  const news = await getNews(req.query.category || 'crypto', req.query.search || '');
  sendResponse(res, 200, 'Crypto news fetched successfully.', news);
}

// Keep duplicate router controller endpoints for backwards routing compatibility with coinRoutes.js
export async function getTrendingApi(_req, res) {
  const trending = await getTrending();
  sendResponse(res, 200, 'Trending coins fetched successfully.', trending);
}

export async function getMarketApi(req, res) {
  const result = await getMarketPage({
    page: req.query.page,
    perPage: req.query.perPage,
    search: req.query.search,
    sort: req.query.sort,
    category: req.query.category,
    priceMin: req.query.priceMin,
    priceMax: req.query.priceMax,
    currency: req.query.currency,
  });
  sendResponse(res, 200, 'Market coins fetched successfully.', result.data, result.pagination);
}

export async function getDetailsApi(req, res) {
  const coin = await getCoinDetails(req.params.id, req.query.currency);
  sendResponse(res, 200, 'Coin details fetched successfully.', coin);
}

export async function getChartApi(req, res) {
  const chart = await getCoinChart(req.params.id, req.query.range || '7D', req.query.currency);
  sendResponse(res, 200, 'Coin chart fetched successfully.', chart);
}

export async function getTestCmc(_req, res) {
  try {
    const info = await testCmc();
    sendResponse(res, 200, 'CMC API Key Info', info);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to verify CMC API key',
      details: error.response?.data?.status || error.message
    });
  }
}
