import { ApiError } from '../utils/apiError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { analyzePortfolioHealth, getPortfolioMetrics } from '../services/portfolioAnalysisService.js';
import { compareCryptos, getQuickComparison } from '../services/coinComparisonService.js';

/**
 * GET /api/ai/portfolio-health
 * Get portfolio health score and analysis for authenticated user
 */
export async function getPortfolioHealth(req, res) {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'User not authenticated.');

  try {
    const health = await analyzePortfolioHealth(userId);
    sendResponse(res, 200, 'Portfolio health analysis generated.', health);
  } catch (error) {
    throw new ApiError(500, `Portfolio analysis failed: ${error.message}`);
  }
}

/**
 * GET /api/ai/portfolio-metrics
 * Get quick portfolio metrics summary
 */
export async function getPortfolioMetricsEndpoint(req, res) {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'User not authenticated.');

  try {
    const metrics = await getPortfolioMetrics(userId);
    sendResponse(res, 200, 'Portfolio metrics fetched.', metrics);
  } catch (error) {
    throw new ApiError(500, `Failed to fetch portfolio metrics: ${error.message}`);
  }
}

/**
 * POST /api/ai/compare
 * Compare two cryptocurrencies using AI
 * Body: { coinA: string, coinB: string }
 */
export async function compareCoinsPair(req, res) {
  const { coinA, coinB } = req.body;

  if (!coinA || !coinB) {
    throw new ApiError(400, 'Both coinA and coinB are required.');
  }

  if (coinA.toLowerCase() === coinB.toLowerCase()) {
    throw new ApiError(400, 'Cannot compare a coin with itself.');
  }

  try {
    const comparison = await compareCryptos(coinA.toLowerCase(), coinB.toLowerCase());
    sendResponse(res, 200, 'Coin comparison generated.', comparison);
  } catch (error) {
    throw new ApiError(500, `Coin comparison failed: ${error.message}`);
  }
}

/**
 * POST /api/ai/quick-compare
 * Get quick metrics comparison between two coins (no AI analysis)
 * Body: { coinA: string, coinB: string }
 */
export async function quickCompareCoinsPair(req, res) {
  const { coinA, coinB } = req.body;

  if (!coinA || !coinB) {
    throw new ApiError(400, 'Both coinA and coinB are required.');
  }

  if (coinA.toLowerCase() === coinB.toLowerCase()) {
    throw new ApiError(400, 'Cannot compare a coin with itself.');
  }

  try {
    const comparison = await getQuickComparison(coinA.toLowerCase(), coinB.toLowerCase());
    sendResponse(res, 200, 'Quick comparison completed.', comparison);
  } catch (error) {
    throw new ApiError(500, `Quick comparison failed: ${error.message}`);
  }
}
