import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aiService } from '../services/aiService';

/**
 * Portfolio Health Score Card
 * Displays AI-generated portfolio health metrics
 */
export function PortfolioHealthCard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await aiService.getPortfolioHealth();
        setHealth(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load portfolio health');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md"
      >
        <div className="space-y-4">
          <div className="h-8 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-red-500/20 bg-red-950/20 backdrop-blur-md"
      >
        <p className="text-red-400 font-medium">{error}</p>
        <p className="text-red-300 text-sm mt-2">Add holdings to your portfolio to see health analysis</p>
      </motion.div>
    );
  }

  if (!health || health.healthScore === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md"
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Portfolio Health Score</h3>
          <p className="text-gray-400">Add holdings to your portfolio to get started</p>
        </div>
      </motion.div>
    );
  }

  const scoreColor = health.healthScore >= 70 ? 'from-green-400 to-emerald-600' : 
                     health.healthScore >= 40 ? 'from-yellow-400 to-orange-600' : 
                     'from-red-400 to-rose-600';

  const riskColor = health.riskScore <= 3 ? 'text-green-400' : 
                    health.riskScore <= 6 ? 'text-yellow-400' : 
                    'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <motion.div
        className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-md"
        whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Portfolio Health Score</h2>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Health Score */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:bg-white/10 transition-all"
          >
            <p className="text-gray-400 text-sm mb-2">Overall Health</p>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
                {health.healthScore}
              </div>
              <div className="text-xs text-gray-500">/100</div>
            </div>
          </motion.div>

          {/* Risk Score */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:bg-white/10 transition-all"
          >
            <p className="text-gray-400 text-sm mb-2">Risk Score</p>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${riskColor}`}>
                {health.riskScore}
              </div>
              <div className="text-xs text-gray-500">/10</div>
            </div>
          </motion.div>

          {/* Diversification */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:bg-white/10 transition-all"
          >
            <p className="text-gray-400 text-sm mb-2">Diversification</p>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-blue-400">
                {health.diversificationScore}
              </div>
              <div className="text-xs text-gray-500">/100</div>
            </div>
          </motion.div>
        </div>

        {/* Risk Level Badge */}
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-2">Risk Level</p>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm backdrop-blur-md border ${
              health.riskLevel === 'Low'
                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                : health.riskLevel === 'Medium'
                ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            {health.riskLevel}
          </motion.div>
        </div>
      </motion.div>

      {/* Strengths */}
      <ExpandableSection
        title="Portfolio Strengths"
        items={health.strengths}
        icon="💪"
        color="green"
        isExpanded={expandedSection === 'strengths'}
        onToggle={() => setExpandedSection(expandedSection === 'strengths' ? null : 'strengths')}
      />

      {/* Weaknesses */}
      <ExpandableSection
        title="Potential Weaknesses"
        items={health.weaknesses}
        icon="⚠️"
        color="orange"
        isExpanded={expandedSection === 'weaknesses'}
        onToggle={() => setExpandedSection(expandedSection === 'weaknesses' ? null : 'weaknesses')}
      />

      {/* Recommendations */}
      <ExpandableSection
        title="AI Recommendations"
        items={health.recommendations}
        icon="🎯"
        color="blue"
        isExpanded={expandedSection === 'recommendations'}
        onToggle={() => setExpandedSection(expandedSection === 'recommendations' ? null : 'recommendations')}
      />

      {/* Portfolio Summary */}
      {health.totalValue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Portfolio Value</p>
              <p className="text-white font-semibold">${health.totalValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Holdings</p>
              <p className="text-white font-semibold">{health.holdingCount} Coins</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Expandable Section Component
 */
function ExpandableSection({ title, items, icon, color, isExpanded, onToggle }) {
  const borderColor = color === 'green' ? 'border-green-500/20' : color === 'orange' ? 'border-orange-500/20' : 'border-blue-500/20';
  const bgColor = color === 'green' ? 'bg-green-500/5' : color === 'orange' ? 'bg-orange-500/5' : 'bg-blue-500/5';
  const hoverBgColor = color === 'green' ? 'hover:bg-green-500/10' : color === 'orange' ? 'hover:bg-orange-500/10' : 'hover:bg-blue-500/10';
  const textColor = color === 'green' ? 'text-green-300' : color === 'orange' ? 'text-orange-300' : 'text-blue-300';

  return (
    <motion.div
      className={`rounded-xl border ${borderColor} ${bgColor} backdrop-blur-md overflow-hidden transition-all`}
      whileHover={{ borderColor: color === 'green' ? 'rgba(34,197,94,0.4)' : color === 'orange' ? 'rgba(249,115,22,0.4)' : 'rgba(59,130,246,0.4)' }}
    >
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between font-semibold hover:opacity-80 transition-opacity ${hoverBgColor}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className={textColor}>{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400"
        >
          ▼
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <ul className="px-4 pb-4 space-y-2">
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`text-sm ${color === 'green' ? 'text-green-200' : color === 'orange' ? 'text-orange-200' : 'text-blue-200'} flex gap-2`}
              >
                <span className="mt-1 flex-shrink-0">•</span>
                <span>{item}</span>
              </motion.li>
            ))
          ) : (
            <li className="text-gray-500 text-sm italic">No items to display</li>
          )}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export default PortfolioHealthCard;
