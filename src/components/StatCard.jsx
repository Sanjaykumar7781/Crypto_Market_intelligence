import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, sub, tone = 'cyan' }) {
  const isPositive = tone === 'green' || (sub && sub.startsWith('+'));
  const isNegative = tone === 'rose' || (sub && sub.startsWith('-'));
  
  const accentColor = tone === 'green' 
    ? 'rgba(47,244,166,0.3)' 
    : tone === 'rose' 
    ? 'rgba(255,77,141,0.3)' 
    : 'rgba(40,215,255,0.3)';
    
  const textTone = tone === 'green' ? 'text-mint' : tone === 'rose' ? 'text-roseGlow' : 'text-cyanGlow';
  const bgTone = tone === 'green' ? 'bg-mint/10' : tone === 'rose' ? 'bg-roseGlow/10' : 'bg-cyanGlow/10';

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="metric-card-premium group"
      style={{
        '--glow-start': accentColor,
        '--glow-end': 'rgba(139,92,246,0.15)'
      }}
    >
      {/* Background glow orb */}
      <div className={`absolute -right-10 -top-10 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 ${bgTone}`} />
      
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-300 transition-colors">{label}</p>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-black tracking-tight text-white font-display"
          >
            {value}
          </motion.p>
          
          <div className="flex items-center gap-1.5 mt-2">
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
          <span className={`grid size-11 place-items-center rounded-xl transition duration-300 group-hover:scale-110 ${bgTone} ${textTone} shadow-inner`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </motion.div>
  );
}
