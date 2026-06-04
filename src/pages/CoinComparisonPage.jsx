import { CoinComparisonPanel } from '../components/CoinComparisonPanel';
import { motion } from 'framer-motion';

/**
 * Coin Comparison Page
 * Full-page view of cryptocurrency comparison with AI analysis
 */
export function CoinComparisonPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-24 pb-12"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-300 bg-clip-text text-transparent mb-3">
            Cryptocurrency Comparison
          </h1>
          <p className="text-gray-400 text-lg">
            Compare two cryptocurrencies side-by-side with AI-powered market analysis and insights.
          </p>
        </motion.div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-center"
          >
            <span className="text-2xl mb-2 block">📊</span>
            <p className="text-white text-sm font-semibold">Market Data</p>
            <p className="text-gray-400 text-xs mt-1">Real-time metrics</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-center"
          >
            <span className="text-2xl mb-2 block">🤖</span>
            <p className="text-white text-sm font-semibold">AI Analysis</p>
            <p className="text-gray-400 text-xs mt-1">Deep insights</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-center"
          >
            <span className="text-2xl mb-2 block">⚙️</span>
            <p className="text-white text-sm font-semibold">Technology</p>
            <p className="text-gray-400 text-xs mt-1">Technical comparison</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-center"
          >
            <span className="text-2xl mb-2 block">🏆</span>
            <p className="text-white text-sm font-semibold">AI Verdict</p>
            <p className="text-gray-400 text-xs mt-1">Investment recommendation</p>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <CoinComparisonPanel />
        </motion.div>

        {/* Comparison Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md"
        >
          <h3 className="text-lg font-bold text-white mb-4">Popular Comparisons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ComparisonExample coin1="Bitcoin" coin2="Ethereum" vs="Layer 1 vs Layer 1" />
            <ComparisonExample coin1="Solana" coin2="Cardano" vs="High speed vs Sustainability" />
            <ComparisonExample coin1="Chainlink" coin2="Avalanche" vs="Oracles vs L1" />
            <ComparisonExample coin1="Polygon" coin2="Arbitrum" vs="Both L2 Solutions" />
            <ComparisonExample coin1="Ripple" coin2="Stellar" vs="Payment networks" />
            <ComparisonExample coin1="Dogecoin" coin2="Litecoin" vs="Meme vs Silver" />
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-center text-gray-400 text-sm"
        >
          <p>⚡ AI analysis powered by Groq LLM with real-time CoinGecko market data.</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Comparison Example Card
 */
function ComparisonExample({ coin1, coin2, vs }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 cursor-pointer transition-all text-center"
    >
      <p className="text-white font-semibold">
        {coin1} vs {coin2}
      </p>
      <p className="text-gray-400 text-xs mt-1">{vs}</p>
    </motion.div>
  );
}

export default CoinComparisonPage;
