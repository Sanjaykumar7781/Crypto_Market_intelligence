import { askGroq } from './groqServices.js';
import { getMarkets } from './cryptoService.js';

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
 * Fetch coin market data by ID
 */
async function fetchCoinMarketData(coinId) {
  try {
    const markets = await getMarkets(250);
    const coin = markets.find(c => c.id.toLowerCase() === coinId.toLowerCase());
    return coin || null;
  } catch (error) {
    console.error(`Error fetching market data for ${coinId}:`, error);
    return null;
  }
}

/**
 * Format market data for AI comparison
 */
function formatCoinDataForComparison(coin) {
  if (!coin) return null;

  return {
    id: coin.id,
    symbol: coin.symbol?.toUpperCase(),
    name: coin.name,
    currentPrice: coin.current_price,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    circulatingSupply: coin.circulating_supply,
    maxSupply: coin.max_supply,
    priceChange24h: coin.price_change_percentage_24h,
    priceChange7d: coin.price_change_percentage_7d,
    marketCapRank: coin.market_cap_rank,
    athPrice: coin.ath,
    atlPrice: coin.atl,
    dominance: coin.market_cap_rank ? (100 / coin.market_cap_rank) * 0.5 : 0,
  };
}

/**
 * Generate AI coin comparison
 */
export async function compareCryptos(coinAId, coinBId) {
  try {
    // Fetch market data for both coins
    const coinAMarket = await fetchCoinMarketData(coinAId);
    const coinBMarket = await fetchCoinMarketData(coinBId);

    if (!coinAMarket || !coinBMarket) {
      throw new Error(`Could not fetch market data for ${!coinAMarket ? coinAId : coinBId}`);
    }

    const coinAData = formatCoinDataForComparison(coinAMarket);
    const coinBData = formatCoinDataForComparison(coinBMarket);

    // Build detailed comparison prompt
    const prompt = `You are an expert cryptocurrency analyst. Compare these two cryptocurrencies comprehensively.

Cryptocurrency A - ${coinAData.name} (${coinAData.symbol}):
- Current Price: $${coinAData.currentPrice}
- Market Cap: $${coinAData.marketCap?.toLocaleString() || 'N/A'}
- 24h Volume: $${coinAData.volume24h?.toLocaleString() || 'N/A'}
- Market Cap Rank: #${coinAData.marketCapRank}
- Circulating Supply: ${coinAData.circulatingSupply?.toLocaleString() || 'N/A'}
- 24h Change: ${coinAData.priceChange24h?.toFixed(2)}%
- 7d Change: ${coinAData.priceChange7d?.toFixed(2)}%
- ATH: $${coinAData.athPrice}
- ATL: $${coinAData.atlPrice}

Cryptocurrency B - ${coinBData.name} (${coinBData.symbol}):
- Current Price: $${coinBData.currentPrice}
- Market Cap: $${coinBData.marketCap?.toLocaleString() || 'N/A'}
- 24h Volume: $${coinBData.volume24h?.toLocaleString() || 'N/A'}
- Market Cap Rank: #${coinBData.marketCapRank}
- Circulating Supply: ${coinBData.circulatingSupply?.toLocaleString() || 'N/A'}
- 24h Change: ${coinBData.priceChange24h?.toFixed(2)}%
- 7d Change: ${coinBData.priceChange7d?.toFixed(2)}%
- ATH: $${coinBData.athPrice}
- ATL: $${coinBData.atlPrice}

Provide a detailed JSON comparison with these keys:
{
  "winner": "${coinAData.symbol}" | "${coinBData.symbol}" | "Tie",
  "comparison": {
    "adoption": "2-3 sentence comparison of real-world adoption and use case",
    "technology": "2-3 sentence comparison of underlying technology and innovation",
    "scalability": "2-3 sentence comparison of scalability and network capacity",
    "security": "2-3 sentence comparison of security features",
    "marketPosition": "2-3 sentence comparison of market dominance and position"
  },
  "summary": "3-4 sentence overall comparison summary",
  "recommendation": "Investment recommendation considering both coins",
  "priceComparison": {
    "coinA": { "current": number, "ath": number, "atl": number },
    "coinB": { "current": number, "ath": number, "atl": number }
  },
  "volumeComparison": {
    "coinA": number,
    "coinB": number
  },
  "riskComparison": {
    "coinA": "Low" | "Medium" | "High",
    "coinB": "Low" | "Medium" | "High"
  },
  "growthPotential": {
    "coinA": "Low" | "Medium" | "High",
    "coinB": "Low" | "Medium" | "High"
  }
}

Return ONLY valid JSON, no extra text.`;

    const aiResponse = await askGroq([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    const analysis = parseJsonPayload(aiResponse);

    return {
      coinA: coinAData,
      coinB: coinBData,
      analysis: analysis || null,
      raw: aiResponse,
      structured: Boolean(analysis),
    };
  } catch (error) {
    console.error('Error comparing cryptocurrencies:', error);
    throw error;
  }
}

/**
 * Get quick coin comparison metrics
 */
export async function getQuickComparison(coinAId, coinBId) {
  try {
    const coinA = await fetchCoinMarketData(coinAId);
    const coinB = await fetchCoinMarketData(coinBId);

    if (!coinA || !coinB) {
      throw new Error('Could not fetch market data for comparison');
    }

    return {
      coinA: {
        name: coinA.name,
        symbol: coinA.symbol?.toUpperCase(),
        price: coinA.current_price,
        marketCap: coinA.market_cap,
        change24h: coinA.price_change_percentage_24h,
        rank: coinA.market_cap_rank,
      },
      coinB: {
        name: coinB.name,
        symbol: coinB.symbol?.toUpperCase(),
        price: coinB.current_price,
        marketCap: coinB.market_cap,
        change24h: coinB.price_change_percentage_24h,
        rank: coinB.market_cap_rank,
      },
      metrics: {
        priceDifference: ((coinA.current_price - coinB.current_price) / coinB.current_price) * 100,
        marketCapRatio: coinA.market_cap / coinB.market_cap,
        performanceGap: coinA.price_change_percentage_24h - coinB.price_change_percentage_24h,
      },
    };
  } catch (error) {
    console.error('Error getting quick comparison:', error);
    throw error;
  }
}
