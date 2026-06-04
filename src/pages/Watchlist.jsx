import { motion } from 'framer-motion';
import { Star, BarChart3, TrendingUp } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import CoinTable from '../components/CoinTable.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import { currency, percent } from '../utils/format.js';

export default function Watchlist() {
  const { items } = useWatchlist();
  const { currencyCode } = useCurrency();
  const value = items.reduce((sum, item) => sum + (item.currentPrice || 0), 0);
  const change = items.length ? items.reduce((sum, item) => sum + (item.change24h || 0), 0) / items.length : 0;

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyanGlow">Personal Tracking</p>
            <h1 className="mt-3 text-4xl font-black text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Watchlist Monitor</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time alerts and stats of your saved digital assets</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="metric-card-premium group min-w-36 p-4 py-3" style={{ '--glow-start': 'rgba(6,182,212,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <BarChart3 size={13} className="text-cyanGlow" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tracked Value</span>
              </div>
              <p className="text-lg font-black text-white">{currency(value, false, currencyCode)}</p>
            </div>
            <div className="metric-card-premium group min-w-36 p-4 py-3" style={{ '--glow-start': change >= 0 ? 'rgba(47,244,166,0.2)' : 'rgba(255,77,141,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp size={13} className={change >= 0 ? 'text-mint' : 'text-roseGlow'} />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg 24h P/L</span>
              </div>
              <p className={`text-lg font-black ${change >= 0 ? 'text-mint' : 'text-roseGlow'}`}>{percent(change)}</p>
            </div>
          </div>
        </div>

        <div className="mt-2">
          {items.length ? (
            <CoinTable coins={items} />
          ) : (
            <div className="glass-premium rounded-2xl p-10 text-center border border-white/8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyanGlow/5 blur-3xl pointer-events-none rounded-full" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500">
                  <Star size={24} />
                </div>
                <h2 className="text-lg font-black text-white">No assets saved yet</h2>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">Use the star icon in market tables or coin pages to build your custom watchlist tracker.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </PageShell>
  );
}
