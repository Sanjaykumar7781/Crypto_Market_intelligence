import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, sub, tone = 'gray' }) {
  const isPositive = tone === 'green' || (sub && sub.startsWith('+'));
  const isNegative = tone === 'rose' || (sub && sub.startsWith('-'));
  
  const textTone = tone === 'green' ? 'text-success' : tone === 'rose' ? 'text-danger' : 'text-primary';
  const bgTone = tone === 'green' ? 'bg-success/10' : tone === 'rose' ? 'bg-danger/10' : 'bg-primary/10';

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-700 transition-colors">{label}</p>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-black tracking-tight text-gray-900"
          >
            {value}
          </motion.p>
          
          <div className="flex items-center gap-1.5 pt-1">
            {sub && (
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${bgTone} ${textTone}`}>
                {isPositive && '▲'}
                {isNegative && '▼'}
                {sub}
              </span>
            )}
          </div>
        </div>
        
        {Icon && (
          <span className={`grid size-12 place-items-center rounded-xl transition duration-300 ${bgTone} ${textTone}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </motion.div>
  );
}
