import { useState } from 'react';
import { motion } from 'framer-motion';
import { aiService } from '../services/aiService';

/**
 * Coin Comparison Panel
 * Compare two cryptocurrencies with AI analysis
 */
export function CoinComparisonPanel() {
  const [coinA, setCoinA] = useState('bitcoin');
  const [coinB, setCoinB] = useState('ethereum');
  const [comparison, setComparison] = useState(null);
  const [quickMetrics, setQuickMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const popularCoins = [
    'bitcoin',
    'ethereum',
    'cardano',
    'solana',
    'polkadot',
    'chainlink',
    'ripple',
    'avalanche',
    'litecoin',
    'dogecoin',
  ];

  const handleCompare = async () => {
    if (coinA === coinB) {
      setError('Please select two different coins');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [fullAnalysis, quick] = await Promise.all([
        aiService.compareCryptos(coinA, coinB),
        aiService.quickCompareCryptos(coinA, coinB),
      ]);
      setComparison(fullAnalysis.data);
      setQuickMetrics(quick.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare coins');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapCoins = () => {
    const temp = coinA;
    setCoinA(coinB);
    setCoinB(temp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Input Section */}
      <motion.div
        className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md"
        whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Compare Cryptocurrencies</h2>

        <div className="space-y-4">
          {/* Coin Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Coin A Select */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">Cryptocurrency A</label>
              <select
                value={coinA}
                onChange={(e) => setCoinA(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize hover:border-white/30 transition-all"
              >
                {popularCoins.map((coin) => (
                  <option key={coin} value={coin} className="bg-slate-900">
                    {coin.charAt(0).toUpperCase() + coin.slice(1)}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Swap Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="flex justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSwapCoins}
                className="p-3 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-white"
                title="Swap coins"
              >
                ⇄
              </motion.button>
            </motion.div>

            {/* Coin B Select */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">Cryptocurrency B</label>
              <select
                value={coinB}
                onChange={(e) => setCoinB(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent capitalize hover:border-white/30 transition-all"
              >
                {popularCoins.map((coin) => (
                  <option key={coin} value={coin} className="bg-slate-900">
                    {coin.charAt(0).toUpperCase() + coin.slice(1)}
                  </option>
                ))}
              </select>
            </motion.div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Compare Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCompare}
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Analyzing...
              </>
            ) : (
              <>
                <span>🔍</span>
                Compare with AI
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Metrics */}
      {quickMetrics && !loading && (
        <QuickMetricsDisplay metrics={quickMetrics} />
      )}

      {/* Full AI Analysis */}
      {comparison && !loading && (
        <FullAnalysisDisplay analysis={comparison} coinAName={coinA} coinBName={coinB} />
      )}
    </motion.div>
  );
}

/**
 * Quick Metrics Display Component
 */
function QuickMetricsDisplay({ metrics }) {
  if (!metrics.data) return null;

  const { data } = metrics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md"
    >
      <h3 className="text-xl font-bold text-white mb-4">📊 Market Metrics</h3>

      <div className="space-y-4">
        {/* Price Comparison */}
        <ComparisonRow
          label="Current Price"
          valueA={`$${data.coinA?.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          valueB={`$${data.coinB?.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          symbolA={data.coinA?.symbol}
          symbolB={data.coinB?.symbol}
        />

        {/* Market Cap Comparison */}
        <ComparisonRow
          label="Market Cap"
          valueA={`$${(data.coinA?.marketCap / 1e9).toFixed(2)}B`}
          valueB={`$${(data.coinB?.marketCap / 1e9).toFixed(2)}B`}
          symbolA={data.coinA?.symbol}
          symbolB={data.coinB?.symbol}
          highlight={true}
        />

        {/* 24h Change */}
        <ComparisonRow
          label="24h Change"
          valueA={`${data.coinA?.change24h?.toFixed(2)}%`}
          valueB={`${data.coinB?.change24h?.toFixed(2)}%`}
          symbolA={data.coinA?.symbol}
          symbolB={data.coinB?.symbol}
          isPercentage={true}
        />

        {/* Market Rank */}
        <ComparisonRow
          label="Market Rank"
          valueA={`#${data.coinA?.rank}`}
          valueB={`#${data.coinB?.rank}`}
          symbolA={data.coinA?.symbol}
          symbolB={data.coinB?.symbol}
        />

        {/* Price Difference */}
        {data.metrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Price Ratio</p>
                <p className="text-white font-semibold">
                  {(data.metrics.priceDifference > 0 ? '+' : '')}
                  {data.metrics.priceDifference?.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Market Cap Ratio</p>
                <p className="text-white font-semibold">
                  {data.metrics.marketCapRatio?.toFixed(2)}x
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Performance Gap</p>
                <p className={`font-semibold ${data.metrics.performanceGap > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.metrics.performanceGap?.toFixed(2)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Full AI Analysis Display
 */
function FullAnalysisDisplay({ analysis, coinAName, coinBName }) {
  if (!analysis || !analysis.analysis) return null;

  const { analysis: aiAnalysis } = analysis;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Winner Badge */}
      <motion.div
        className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md"
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">🏆 AI Verdict</h3>
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg"
          >
            {aiAnalysis.winner} Wins
          </motion.div>
        </div>
        <p className="text-gray-300 mt-3 leading-relaxed">{aiAnalysis.summary}</p>
        <p className="text-yellow-300 mt-3 text-sm italic">💡 {aiAnalysis.recommendation}</p>
      </motion.div>

      {/* Expandable Sections */}
      <AnalysisSection
        title="Technology & Innovation"
        icon="⚙️"
        content={aiAnalysis.comparison?.technology}
        color="blue"
      />
      <AnalysisSection
        title="Market Adoption"
        icon="🌍"
        content={aiAnalysis.comparison?.adoption}
        color="green"
      />
      <AnalysisSection
        title="Scalability"
        icon="📈"
        content={aiAnalysis.comparison?.scalability}
        color="purple"
      />
      <AnalysisSection
        title="Security Features"
        icon="🔒"
        content={aiAnalysis.comparison?.security}
        color="orange"
      />
      <AnalysisSection
        title="Market Position"
        icon="💼"
        content={aiAnalysis.comparison?.marketPosition}
        color="indigo"
      />

      {/* Risk & Growth Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <RiskGrowthCard
          title="Risk Level"
          coinA={coinAName}
          coinB={coinBName}
          valueA={aiAnalysis.riskComparison?.coinA}
          valueB={aiAnalysis.riskComparison?.coinB}
          type="risk"
        />
        <RiskGrowthCard
          title="Growth Potential"
          coinA={coinAName}
          coinB={coinBName}
          valueA={aiAnalysis.growthPotential?.coinA}
          valueB={aiAnalysis.growthPotential?.coinB}
          type="growth"
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Comparison Row Component
 */
function ComparisonRow({ label, valueA, valueB, symbolA, symbolB, highlight = false, isPercentage = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border ${highlight ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10 bg-white/5'}`}
    >
      <p className="text-gray-400 text-sm mb-3 font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">{symbolA}</p>
            <p className={`font-semibold text-white ${isPercentage && valueA.includes('-') ? 'text-red-400' : isPercentage ? 'text-green-400' : ''}`}>
              {valueA}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs">{symbolB}</p>
            <p className={`font-semibold text-white ${isPercentage && valueB.includes('-') ? 'text-red-400' : isPercentage ? 'text-green-400' : ''}`}>
              {valueB}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Analysis Section Component
 */
function AnalysisSection({ title, icon, content, color }) {
  const [isOpen, setIsOpen] = useState(false);
  const colorClasses = {
    blue: 'border-blue-500/20 bg-blue-500/5 text-blue-300',
    green: 'border-green-500/20 bg-green-500/5 text-green-300',
    purple: 'border-purple-500/20 bg-purple-500/5 text-purple-300',
    orange: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
    indigo: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-300',
  };

  return (
    <motion.div className={`rounded-xl border ${colorClasses[color]} backdrop-blur-md overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between font-semibold hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span>{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          ▼
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <p className="px-4 pb-4 text-sm leading-relaxed text-gray-200">{content}</p>
      </motion.div>
    </motion.div>
  );
}

/**
 * Risk & Growth Card Component
 */
function RiskGrowthCard({ title, coinA, coinB, valueA, valueB, type }) {
  const getColor = (value) => {
    if (value === 'Low') return type === 'risk' ? 'text-green-400' : 'text-orange-400';
    if (value === 'Medium') return 'text-yellow-400';
    return type === 'risk' ? 'text-red-400' : 'text-green-400';
  };

  const getBgColor = (value) => {
    if (value === 'Low') return type === 'risk' ? 'bg-green-500/20' : 'bg-orange-500/20';
    if (value === 'Medium') return 'bg-yellow-500/20';
    return type === 'risk' ? 'bg-red-500/20' : 'bg-green-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
    >
      <p className="text-gray-400 text-sm mb-4 font-medium">{title}</p>
      <div className="space-y-3">
        <div>
          <p className="text-gray-500 text-xs mb-1 capitalize">{coinA}</p>
          <div className={`px-3 py-2 rounded-lg ${getBgColor(valueA)} ${getColor(valueA)} font-semibold text-center`}>
            {valueA}
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1 capitalize">{coinB}</p>
          <div className={`px-3 py-2 rounded-lg ${getBgColor(valueB)} ${getColor(valueB)} font-semibold text-center`}>
            {valueB}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CoinComparisonPanel;
