import { askGroq } from './groqServices.js';
import { getMarkets } from './cryptoService.js';
import { Portfolio } from '../models/Portfolio.js';

/**
 * Parse JSON from Groq response
 */
function parseJsonPayload(reply) {
  if (!reply || typeof reply !== 'string') return null;

  const jsonMatch = reply.match(/\{[\s\S]*\}/m);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * Fetch detailed market data for portfolio holdings
 */
async function fetchHoldingsMarketData(holdings) {
  if (!holdings || holdings.length === 0) return [];

  try {
    const markets = await getMarkets(250);
    return markets.filter(m => holdings.some(h => h.coinId === m.id));
  } catch (error) {
    console.error('Error fetching holdings market data:', error);
    return [];
  }
}

/**
 * Calculate portfolio allocation percentages
 */
function calculateAllocation(holdings, marketData) {
  const allocationMap = new Map();
  let totalValue = 0;

  holdings.forEach(holding => {
    const market = marketData.find(m => m.id === holding.coinId);
    if (market && market.current_price) {
      const holdingValue = holding.amount * market.current_price;
      allocationMap.set(holding.symbol, {
        symbol: holding.symbol,
        coinId: holding.coinId,
        amount: holding.amount,
        currentPrice: market.current_price,
        value: holdingValue,
        percentOfPortfolio: 0,
      });
      totalValue += holdingValue;
    }
  });

  allocationMap.forEach(allocation => {
    allocation.percentOfPortfolio = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;
  });

  return {
    allocations: Array.from(allocationMap.values()),
    totalValue,
  };
}

/**
 * Categorize coins by market cap
 */
function categorizeCoinsByMarketCap(allocation, marketData) {
  const categories = {
    largeCap: [],
    midCap: [],
    smallCap: [],
    stablecoin: [],
  };

  allocation.allocations.forEach(alloc => {
    const market = marketData.find(m => m.id === alloc.coinId);
    if (!market) return;

    const marketCap = market.market_cap || 0;
    const symbol = alloc.symbol.toUpperCase();

    if (['USDT', 'USDC', 'DAI', 'BUSD', 'USDD'].includes(symbol)) {
      categories.stablecoin.push({ ...alloc, marketCap });
    } else if (marketCap > 100_000_000_000) {
      categories.largeCap.push({ ...alloc, marketCap });
    } else if (marketCap > 1_000_000_000) {
      categories.midCap.push({ ...alloc, marketCap });
    } else {
      categories.smallCap.push({ ...alloc, marketCap });
    }
  });

  return categories;
}

/**
 * Generate portfolio health analysis using Groq AI
 */
export async function analyzePortfolioHealth(userId) {
  try {
    // Fetch user portfolio
    const portfolio = await Portfolio.findOne({ userId }).lean();

    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
      return {
        healthScore: 0,
        riskScore: 5,
        diversificationScore: 0,
        riskLevel: 'Unknown',
        strengths: ['Empty portfolio - ready to start investing'],
        weaknesses: ['No holdings to analyze'],
        recommendations: ['Add your first cryptocurrency holdings to get started'],
        allocation: [],
        categories: null,
        totalValue: 0,
        holdingCount: 0,
      };
    }

    // Fetch market data
    const marketData = await fetchHoldingsMarketData(portfolio.holdings);

    // Calculate allocation
    const { allocations, totalValue } = calculateAllocation(portfolio.holdings, marketData);

    // Categorize coins
    const categories = categorizeCoinsByMarketCap({ allocations }, marketData);

    // Build analysis prompt
    const prompt = `You are an expert cryptocurrency portfolio analyst. Analyze this portfolio allocation and provide a comprehensive health assessment.

Portfolio Allocation:
${JSON.stringify(allocations, null, 2)}

Market Categorization:
- Large Cap Holdings: ${categories.largeCap.map(c => `${c.symbol} (${c.percentOfPortfolio.toFixed(2)}%)`).join(', ') || 'None'}
- Mid Cap Holdings: ${categories.midCap.map(c => `${c.symbol} (${c.percentOfPortfolio.toFixed(2)}%)`).join(', ') || 'None'}
- Small Cap Holdings: ${categories.smallCap.map(c => `${c.symbol} (${c.percentOfPortfolio.toFixed(2)}%)`).join(', ') || 'None'}
- Stablecoins: ${categories.stablecoin.map(c => `${c.symbol} (${c.percentOfPortfolio.toFixed(2)}%)`).join(', ') || 'None'}
- Total Holdings: ${portfolio.holdings.length}
- Portfolio Value: $${totalValue.toFixed(2)}

Provide a JSON response with ONLY these keys:
{
  "healthScore": number (0-100),
  "riskScore": number (0-10),
  "diversificationScore": number (0-100),
  "riskLevel": "Low" | "Medium" | "High",
  "strengths": array of strings (3-5 points),
  "weaknesses": array of strings (2-4 points),
  "recommendations": array of strings (3-5 actionable suggestions)
}

Consider: diversification across market caps, concentration risks, stablecoin cushion, number of holdings, and volatility exposure.
Return ONLY the JSON object, no extra text.`;

    const aiResponse = await askGroq([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const analysis = parseJsonPayload(aiResponse);

    return {
      ...analysis,
      allocation: allocations,
      categories,
      totalValue,
      holdingCount: portfolio.holdings.length,
      raw: aiResponse,
    };
  } catch (error) {
    console.error('Error analyzing portfolio health:', error);
    throw error;
  }
}

/**
 * Get detailed portfolio metrics for dashboard
 */
export async function getPortfolioMetrics(userId) {
  try {
    const portfolio = await Portfolio.findOne({ userId }).lean();

    if (!portfolio || !portfolio.holdings || portfolio.holdings.length === 0) {
      return {
        totalValue: 0,
        holdingCount: 0,
        diversification: 'N/A',
        allocation: [],
        topHoldings: [],
      };
    }

    const marketData = await fetchHoldingsMarketData(portfolio.holdings);
    const { allocations, totalValue } = calculateAllocation(portfolio.holdings, marketData);

    const topHoldings = allocations
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(h => ({
        symbol: h.symbol,
        percent: h.percentOfPortfolio,
        value: h.value,
      }));

    return {
      totalValue,
      holdingCount: portfolio.holdings.length,
      topHoldings,
      allocation: allocations,
    };
  } catch (error) {
    console.error('Error getting portfolio metrics:', error);
    return {
      totalValue: 0,
      holdingCount: 0,
      topHoldings: [],
      allocation: [],
    };
  }
}
