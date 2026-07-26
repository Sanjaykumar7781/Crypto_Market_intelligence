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
        className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm backdrop-blur-md"
      >
        <div className="space-y-4">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse" />
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
        className="p-6 rounded-2xl border border-red-200 bg-red-50 backdrop-blur-md"
      >
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-red-500 text-sm mt-2">Add holdings to your portfolio to see health analysis</p>
      </motion.div>
    );
  }

  if (!health || health.healthScore === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Portfolio Health Score</h3>
          <p className="text-gray-500">Add holdings to your portfolio to get started</p>
        </div>
      </motion.div>
    );
  }

  const scoreColor = health.healthScore >= 70 ? 'from-emerald-500 to-emerald-700' : 
                     health.healthScore >= 40 ? 'from-amber-500 to-amber-700' : 
                     'from-gray-500 to-gray-700';

  const riskColor = health.riskScore <= 3 ? 'text-teal-500' : 
                    health.riskScore <= 6 ? 'text-amber-600' : 
                    'text-rose-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header */}
      <motion.div
        className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm"
        whileHover={{ borderColor: 'rgba(0,0,0,0.1)' }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Health Score</h2>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Health Score */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border border-gray-200 bg-gray-50 backdrop-blur-sm hover:border-gray-300 hover:bg-gray-100 transition-all"
          >
            <p className="text-gray-500 text-sm mb-2">Overall Health</p>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
                {health.healthScore}
              </div>
              <div className="text-xs text-gray-400">/100</div>
            </div>
          </motion.div>

          {/* Risk Score */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl border border-gray-200 bg-gray-50 backdrop-blur-sm hover:border-gray-300 hover:bg-gray-100 transition-all"
          >
            <p className="text-gray-500 text-sm mb-2">Risk Score</p>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${riskColor}`}>
                {health.riskScore}
              </div>
              <div className="text-xs text-gray-400">/10</div>
            </div>
          </motion.div>

          {/* Diversification */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border border-gray-200 bg-gray-50 backdrop-blur-sm hover:border-gray-300 hover:bg-gray-100 transition-all"
          >
            <p className="text-gray-500 text-sm mb-2">Diversification</p>
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-sky-500">
                {health.diversificationScore}
              </div>
              <div className="text-xs text-gray-400">/100</div>
            </div>
          </motion.div>
        </div>

        {/* Risk Level Badge */}
        <div className="mb-6">
          <p className="text-gray-500 text-sm mb-2">Risk Level</p>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm backdrop-blur-md border ${
              health.riskLevel === 'Low'
                ? 'border-emerald-200 bg-teal-50 text-emerald-700'
                : health.riskLevel === 'Medium'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
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
          className="p-4 rounded-xl border border-gray-200 bg-gray-50 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs mb-1 font-semibold uppercase">Portfolio Value</p>
              <p className="text-gray-900 font-bold text-lg">${health.totalValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1 font-semibold uppercase">Holdings</p>
              <p className="text-gray-900 font-bold text-lg">{health.holdingCount} Coins</p>
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
  const borderColor = color === 'green' ? 'border-emerald-200' : color === 'orange' ? 'border-amber-200' : 'border-cyan-200';
  const bgColor = color === 'green' ? 'bg-emerald-50' : color === 'orange' ? 'bg-amber-50' : 'bg-sky-50';
  const hoverBgColor = color === 'green' ? 'hover:bg-emerald-100' : color === 'orange' ? 'hover:bg-amber-100' : 'hover:bg-cyan-100';
  const textColor = color === 'green' ? 'text-emerald-700' : color === 'orange' ? 'text-amber-700' : 'text-cyan-700';

  return (
    <motion.div
      className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden transition-all shadow-sm`}
      whileHover={{ borderColor: color === 'green' ? 'rgba(34,197,94,0.4)' : color === 'orange' ? 'rgba(249,115,22,0.4)' : 'rgba(59,130,246,0.4)' }}
    >
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between font-bold hover:opacity-80 transition-opacity ${hoverBgColor}`}
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
                className={`text-sm ${color === 'green' ? 'text-emerald-800' : color === 'orange' ? 'text-amber-800' : 'text-cyan-800'} flex gap-2`}
              >
                <span className="mt-1 flex-shrink-0">•</span>
                <span>{item}</span>
              </motion.li>
            ))
          ) : (
            <li className="text-slate-500 text-sm italic">No items to display</li>
          )}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export default PortfolioHealthCard;
