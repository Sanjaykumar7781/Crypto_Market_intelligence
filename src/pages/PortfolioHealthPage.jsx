import { PortfolioHealthCard } from '../components/PortfolioHealthCard';
import { motion } from 'framer-motion';

/**
 * Portfolio Health Page
 * Full-page view of portfolio health analysis
 */
export function PortfolioHealthPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pt-24 pb-12"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-3">
            Portfolio Health Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            AI-powered analysis of your cryptocurrency portfolio with real-time metrics and recommendations.
          </p>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <p className="text-gray-400 text-sm">📊 Health Score</p>
            <p className="text-white font-semibold mt-1">0-100 scale</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <p className="text-gray-400 text-sm">⚠️ Risk Assessment</p>
            <p className="text-white font-semibold mt-1">Low to High</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <p className="text-gray-400 text-sm">🎯 AI Recommendations</p>
            <p className="text-white font-semibold mt-1">Personalized advice</p>
          </motion.div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PortfolioHealthCard />
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md text-center text-gray-400 text-sm"
        >
          <p>💡 Portfolio analysis updates every 5 minutes with the latest market data and AI insights.</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default PortfolioHealthPage;
