import { Portfolio } from '../models/Portfolio.js';
import { ApiError } from '../utils/apiError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { askGroq } from '../services/groqServices.js';
import { validateAnalysis, validateSignal } from '../utils/aiValidator.js';
import { getMarkets } from '../services/cryptoService.js';
import { parseJsonPayload } from '../utils/jsonParser.js';

function sanitizePortfolioForPrompt(portfolio) {
  if (!portfolio) return {};

  return {
    holdings: Array.isArray(portfolio.holdings)
      ? portfolio.holdings.slice(0, 50).map(h => ({
        coinId: String(h.coinId || '').slice(0, 50),
        symbol: String(h.symbol || '').slice(0, 10),
        amount: Number(h.amount) || 0,
        averageBuyPrice: Number(h.averageBuyPrice) || 0,
        notes: String(h.notes || '').slice(0, 100),
      }))
      : [],
    baseCurrency: String(portfolio.baseCurrency || 'USD').slice(0, 5),
  };
}

export async function addPortfolioHolding(req, res) {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'User not authenticated.');

  const { coinId, symbol, amount = 0, averageBuyPrice = 0, notes, baseCurrency = 'USD' } = req.body;

  // Validate inputs
  if (!coinId || typeof coinId !== 'string' || coinId.trim().length === 0) {
    throw new ApiError(400, 'Valid coinId is required.');
  }

  if (!symbol || typeof symbol !== 'string' || symbol.trim().length === 0) {
    throw new ApiError(400, 'Valid symbol is required.');
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 0 || numAmount > 1e10) {
    throw new ApiError(400, 'Amount must be a valid positive number.');
  }

  const numPrice = Number(averageBuyPrice);
  if (isNaN(numPrice) || numPrice < 0 || numPrice > 1e10) {
    throw new ApiError(400, 'Average buy price must be a valid non-negative number.');
  }

  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
  if (!validCurrencies.includes(baseCurrency)) {
    throw new ApiError(400, `baseCurrency must be one of: ${validCurrencies.join(', ')}`);
  }

  const notesStr = notes ? String(notes).trim().substring(0, 500) : '';

  const portfolio = await Portfolio.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId, baseCurrency },
      $push: {
        holdings: {
          coinId: coinId.toLowerCase().trim(),
          symbol: symbol.toUpperCase().trim(),
          amount: numAmount,
          averageBuyPrice: numPrice,
          notes: notesStr,
        },
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  sendResponse(res, 201, 'Portfolio holding added.', portfolio);
}

export async function getPortfolioByUser(req, res) {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'User not authenticated.');

  const portfolio = await Portfolio.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, holdings: [] } },
    { upsert: true, new: true },
  ).lean();

  sendResponse(res, 200, 'Portfolio fetched successfully.', portfolio);
}

export async function removePortfolioHolding(req, res) {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'User not authenticated.');

  if (!req.params.id || typeof req.params.id !== 'string') {
    throw new ApiError(400, 'Invalid holding ID.');
  }

  const portfolio = await Portfolio.findOneAndUpdate(
    { userId, 'holdings._id': req.params.id },
    { $pull: { holdings: { _id: req.params.id } } },
    { new: true },
  );

  if (!portfolio) {
    throw new ApiError(404, 'Portfolio or holding not found.');
  }

  sendResponse(res, 200, 'Portfolio holding removed.', portfolio);
}

export async function analyzePortfolio(req, res) {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'User not authenticated.');

  try {
    const portfolio = await Portfolio.findOne({ userId }).lean();
    const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];

    if (!holdings.length) {
      return sendResponse(res, 200, 'No portfolio holdings found.', {
        error: 'No portfolio data available.',
        analysis: null,
        raw: 'Please add holdings to your portfolio before requesting an analysis.',
      });
    }

    const marketSnapshot = await getMarkets(20);
    const sanitizedPortfolio = sanitizePortfolioForPrompt(portfolio);
    const prompt = `You are an expert crypto portfolio analyst. Analyze the following portfolio and market context. Return ONLY valid JSON with keys: healthScore, riskScore, diversificationScore, strengths, weaknesses, rebalance, recommendations, currentAllocation, recommendedAllocation. healthScore, riskScore, and diversificationScore must be integers between 0 and 100. strengths, weaknesses, and recommendations must be arrays of strings. currentAllocation and recommendedAllocation must be arrays of objects with keys symbol, percent, and value. Do not include extra explanation outside the JSON object.\n\nPortfolio:\n${JSON.stringify(
      sanitizedPortfolio,
      null,
      2,
    )}\n\nMarket snapshot (top 20 coins):\n${JSON.stringify(marketSnapshot, null, 2)}`;

    const reply = await askGroq([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const parsed = parseJsonPayload(reply);
    const validated = parsed ? validateAnalysis(parsed) : null;

    sendResponse(res, 200, 'Portfolio analysis generated.', {
      analysis: validated || null,
      raw: reply,
      structured: Boolean(validated),
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    sendResponse(res, 200, 'Portfolio analysis error.', {
      analysis: null,
      error: 'AI analysis temporarily unavailable. Please try again later.',
    });
  }
}

export async function getTradeSignal(req, res) {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, 'User not authenticated.');

  try {
    const portfolio = await Portfolio.findOne({ userId }).lean();
    const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];

    if (!holdings.length) {
      return sendResponse(res, 200, 'No portfolio holdings found.', {
        error: 'No portfolio data available.',
        signal: null,
        raw: 'Please add holdings to your portfolio before requesting a trade signal.',
      });
    }

    const marketSnapshot = await getMarkets(20);
    const sanitizedPortfolio = sanitizePortfolioForPrompt(portfolio);
    const prompt = `You are a crypto trading assistant. Analyze the user's portfolio and the current market snapshot. Return ONLY valid JSON with keys: recommendation, confidence, riskLevel, explanation, positions. recommendation must be Buy, Hold, or Sell. confidence must be a number between 0 and 100. riskLevel must be Low, Moderate, or High. positions must be an array of objects with keys coinId, symbol, recommendation, confidence, riskLevel, explanation. Do not include any text outside the JSON object.\n\nPortfolio:\n${JSON.stringify(
      sanitizedPortfolio,
      null,
      2,
    )}\n\nMarket snapshot (top 20 coins):\n${JSON.stringify(marketSnapshot, null, 2)}`;

    const reply = await askGroq([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const parsed = parseJsonPayload(reply);
    const validated = parsed ? validateSignal(parsed) : null;

    sendResponse(res, 200, 'Trade signal generated.', {
      signal: validated || null,
      raw: reply,
      structured: Boolean(validated),
    });
  } catch (error) {
    console.error('Trade signal error:', error);
    sendResponse(res, 200, 'Trade signal error.', {
      signal: null,
      error: 'AI signal generation temporarily unavailable. Please try again later.',
    });
  }
}
