import { askGroq } from "../services/groqServices.js";
import { Portfolio } from "../models/Portfolio.js";
import { getMarkets, getTrending, getNews } from "../services/cryptoService.js";
import { validateAnalysis, validateSignal } from '../utils/aiValidator.js';
import { parseJsonPayload } from '../utils/jsonParser.js';

function buildHoldingsSummary(holdings) {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return "No holdings available.";
  }
  return holdings
    .slice(0, 50) // Limit to first 50
    .map(holding => `- ${holding.symbol || holding.coinId}: ${holding.amount} units at avg $${holding.averageBuyPrice || 0}`)
    .join("\n");
}

function buildMarketSnapshotText(marketSnapshot) {
  return marketSnapshot
    .map(coin => `- ${coin.name} (${coin.symbol}): $${coin.currentPrice ?? 0} | 24h ${coin.change24h?.toFixed(2) ?? 0}%`)
    .join("\n");
}

function sanitizeMessage(message) {
  return String(message || '').trim().substring(0, 2000);
}

export async function chatWithAi(req, res) {
  try {
    const { message, history = [] } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const lowerMessage = sanitizeMessage(message).toLowerCase();
    const portfolio = await Portfolio.findOne({ userId }).lean();
    const holdings = Array.isArray(portfolio?.holdings) ? portfolio.holdings : [];
    const marketSnapshot = await getMarkets(20);
    const portfolioSummary = buildHoldingsSummary(holdings);
    const marketSummary = buildMarketSnapshotText(marketSnapshot);

    // Portfolio Analysis
    if (lowerMessage.includes("analyze my portfolio")) {
      if (!holdings.length) {
        return res.json({
          success: true,
          data: { error: "No portfolio data available.", reply: "No holdings found. Add coins to your portfolio first." },
        });
      }

      try {
        const prompt = `You are an expert crypto portfolio analyst. Analyze the user's portfolio and current market snapshot. Return ONLY valid JSON with keys: healthScore, riskScore, diversificationScore, strengths, weaknesses, rebalance, recommendations, currentAllocation, recommendedAllocation. healthScore, riskScore, and diversificationScore must be integers between 0 and 100. strengths, weaknesses, and recommendations must be arrays of strings. currentAllocation and recommendedAllocation must be arrays of objects with keys symbol, percent, and value. Do not provide any text outside the JSON object.\n\nPortfolio holdings:\n${portfolioSummary}\n\nMarket snapshot:\n${marketSummary}`;

        const reply = await askGroq([{ role: "user", content: prompt }]);
        const parsed = parseJsonPayload(reply);
        const validated = parsed ? validateAnalysis(parsed) : null;

        return res.json({ success: true, data: { analysis: validated || null, raw: reply } });
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        return res.json({ success: true, data: { error: 'AI analysis temporarily unavailable', reply: null } });
      }
    }

    // Buy/Hold/Sell Signals
    if (
      lowerMessage.includes("generate buy hold sell signals for my portfolio") ||
      lowerMessage.includes("buy hold sell signals") ||
      lowerMessage.includes("buy signal") ||
      lowerMessage.includes("sell signal")
    ) {
      if (!holdings.length) {
        return res.json({
          success: true,
          data: { error: "No portfolio data available.", reply: "No holdings found. Add coins to your portfolio first." },
        });
      }

      try {
        const prompt = `You are a crypto trading strategist. Analyze the user's portfolio and current market snapshot. Return ONLY valid JSON with keys: recommendation, confidence, riskLevel, explanation, positions. recommendation must be Buy, Hold, or Sell. confidence must be a number from 0 to 100. riskLevel must be Low, Moderate, or High. positions must be an array of objects with keys: coinId, symbol, recommendation, confidence, riskLevel, explanation. Do not provide any text outside the JSON object.\n\nPortfolio holdings:\n${portfolioSummary}\n\nMarket snapshot:\n${marketSummary}`;

        const reply = await askGroq([{ role: "user", content: prompt }]);
        const parsed = parseJsonPayload(reply);
        const validated = parsed ? validateSignal(parsed) : null;

        return res.json({ success: true, data: { signal: validated || null, raw: reply } });
      } catch (aiError) {
        console.error('AI signal error:', aiError);
        return res.json({ success: true, data: { error: 'AI signal generation temporarily unavailable', reply: null } });
      }
    }

    // Rebalancing Suggestions
    if (lowerMessage.includes("rebalance portfolio") || lowerMessage.includes("should i rebalance")) {
      if (!holdings.length) {
        return res.json({
          success: true,
          data: { error: "No portfolio data available.", reply: "No holdings found. Add coins to your portfolio first." },
        });
      }

      try {
        const prompt = `You are a crypto portfolio advisor. Review the portfolio holdings and current market environment. Return a concise text summary of whether the portfolio should be rebalanced, including suggested allocation shifts and risk reduction guidance.`;
        const reply = await askGroq([{ role: "user", content: prompt }]);
        return res.json({ success: true, data: { reply } });
      } catch (aiError) {
        console.error('Rebalancing error:', aiError);
        return res.json({ success: true, data: { error: 'Unable to generate rebalancing advice', reply: null } });
      }
    }

    // Coin Recommendations
    if (lowerMessage.includes("recommend based on my portfolio") || lowerMessage.includes("what coin should i buy")) {
      if (!holdings.length) {
        return res.json({
          success: true,
          data: { error: "No portfolio data available.", reply: "No holdings found. Add coins to your portfolio first." },
        });
      }

      try {
        const prompt = `You are a crypto research analyst. Review the portfolio holdings and recommend 5 coins that complement this allocation. For each coin, provide name, reason, risk level, and expected use case.`;
        const reply = await askGroq([{ role: "user", content: prompt }]);
        return res.json({ success: true, data: { reply } });
      } catch (aiError) {
        console.error('Recommendation error:', aiError);
        return res.json({ success: true, data: { error: 'Unable to generate recommendations', reply: null } });
      }
    }

    // Bitcoin Price
    if (lowerMessage.includes("bitcoin price") || lowerMessage.includes("btc price")) {
      const markets = await getMarkets(20);
      const bitcoin = markets.find(coin => coin.id === "bitcoin");
      return res.json({
        success: true,
        data: {
          reply: bitcoin ? `₿ Bitcoin is currently trading at $${bitcoin.currentPrice}` : "Bitcoin price unavailable right now.",
        },
      });
    }

    // Ethereum Price
    if (lowerMessage.includes("ethereum price") || lowerMessage.includes("eth price")) {
      const markets = await getMarkets(20);
      const ethereum = markets.find(coin => coin.id === "ethereum");
      return res.json({
        success: true,
        data: {
          reply: ethereum ? `⟠ Ethereum is currently trading at $${ethereum.currentPrice}` : "Ethereum price unavailable right now.",
        },
      });
    }

    // Trending Coins
    if (lowerMessage.includes("trending")) {
      try {
        const trending = await getTrending();
        return res.json({
          success: true,
          data: {
            reply: "🔥 Trending Coins\n\n" + trending
              .slice(0, 10)
              .map((coin, index) => `${index + 1}. ${coin.name} (${coin.symbol})`)
              .join("\n"),
          },
        });
      } catch {
        return res.json({ success: true, data: { error: 'Unable to fetch trending coins', reply: null } });
      }
    }

    // Top Gainers
    if (lowerMessage.includes("top gainers")) {
      try {
        const markets = await getMarkets(50);
        const gainers = [...markets].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
        return res.json({
          success: true,
          data: {
            reply: "🚀 Top Gainers Today\n\n" + gainers
              .map((coin, i) => `${i + 1}. ${coin.name} (${coin.symbol}) +${coin.change24h.toFixed(2)}%`)
              .join("\n"),
          },
        });
      } catch {
        return res.json({ success: true, data: { error: 'Unable to fetch gainers', reply: null } });
      }
    }

    // Crypto Sentiment
    if (lowerMessage.includes("sentiment") || lowerMessage.includes("crypto news")) {
      try {
        const news = await getNews("crypto", "");
        const sentimentReply = await askGroq([
          {
            role: "user",
            content: `Analyze these headlines:\n\n${news
              .slice(0, 10)
              .map(item => item.title)
              .join("\n")}\n\nProvide:\n1. Overall sentiment\n2. Summary\n3. Market outlook`,
          },
        ]);
        return res.json({ success: true, data: { reply: sentimentReply } });
      } catch {
        return res.json({ success: true, data: { error: 'Unable to analyze sentiment', reply: null } });
      }
    }

    // General chat with context
    try {
      const marketData = await getMarkets(10);
      const messages = [
        {
          role: "system",
          content: `You are an AI Crypto Market Assistant. Current market data:\n${marketData
            .map(coin => `${coin.name}: $${coin.currentPrice}`)
            .join("\n")}`,
        },
        ...history.map(msg => ({ 
          role: msg.from === "user" ? "user" : "assistant", 
          content: sanitizeMessage(msg.text) 
        })),
        { role: "user", content: sanitizeMessage(message) },
      ];

      const reply = await askGroq(messages);
      return res.json({ success: true, data: { reply } });
    } catch (error) {
      console.error("Chat Error:", error);
      return res.json({ success: true, data: { error: 'Chat temporarily unavailable', reply: null } });
    }
  } catch (error) {
    console.error("Chat Handler Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
