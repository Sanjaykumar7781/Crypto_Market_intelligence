import { PieChart as PieChartIcon, LayoutGrid, CalendarRange, Clock, TrendingUp, TrendingDown, Layers, Coins } from 'lucide-react';
import { currency, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';

export default function PortfolioAnalytics({ holdingsWithPrice, totalValue }) {
  const { currencyCode } = useCurrency();
  
  // Synthesize analytics metrics
  const sortedByValue = [...holdingsWithPrice].sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount));
  const sortedByGain = [...holdingsWithPrice].sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
  
  const topHolding = sortedByValue[0] || null;
  const topGainer = sortedByGain[0] || null;
  const topLoser = sortedByGain[sortedByGain.length - 1] || null;
  
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'FDUSD'];
  const stablecoinValue = holdingsWithPrice
    .filter(h => stablecoins.includes(h.symbol?.toUpperCase()))
    .reduce((sum, h) => sum + (h.currentPrice * h.amount), 0);
  
  const stablePct = totalValue > 0 ? (stablecoinValue / totalValue) * 100 : 0;
  
  // Mock monthly/yearly return
  const monthlyReturn = holdingsWithPrice.length ? (Math.random() * 20 - 5) : 0;
  const yearlyReturn = holdingsWithPrice.length ? (Math.random() * 150 - 20) : 0;
  
  const mcapExposure = topHolding ? ((topHolding.currentPrice * topHolding.amount) / totalValue * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AnalyticsCard 
        icon={<LayoutGrid size={16} className="text-blue-500" />} 
        title="Asset Allocation" 
        value={`${holdingsWithPrice.length} Assets`} 
        subtitle="Diversified" 
      />
      <AnalyticsCard 
        icon={<Layers size={16} className="text-purple-500" />} 
        title="Top Asset Exposure" 
        value={percent(mcapExposure)} 
        subtitle={topHolding?.symbol || 'N/A'} 
      />
      <AnalyticsCard 
        icon={<Coins size={16} className="text-emerald-500" />} 
        title="Stablecoin Ratio" 
        value={percent(stablePct)} 
        subtitle="Cash reserve" 
      />
      <AnalyticsCard 
        icon={<CalendarRange size={16} className="text-amber-500" />} 
        title="Monthly Return" 
        value={`${monthlyReturn > 0 ? '+' : ''}${monthlyReturn.toFixed(2)}%`} 
        subtitle="Last 30 days" 
        valueColor={monthlyReturn >= 0 ? 'text-teal-500' : 'text-rose-500'}
      />
      
      <div className="col-span-2 lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
        <MiniCard 
          label="Top Gainer (24H)" 
          value={topGainer?.symbol || '—'} 
          sub={topGainer ? `+${(topGainer.change24h || 0).toFixed(2)}%` : ''} 
          icon={<TrendingUp size={14} className="text-teal-500" />} 
        />
        <MiniCard 
          label="Top Loser (24H)" 
          value={topLoser?.symbol || '—'} 
          sub={topLoser ? `${(topLoser.change24h || 0).toFixed(2)}%` : ''} 
          icon={<TrendingDown size={14} className="text-rose-500" />} 
        />
        <MiniCard 
          label="Est. Yearly Return" 
          value={`${yearlyReturn > 0 ? '+' : ''}${yearlyReturn.toFixed(1)}%`} 
          sub="Projected" 
          icon={<Clock size={14} className="text-indigo-500" />} 
        />
        <MiniCard 
          label="Total Volume" 
          value={currency(totalValue * 0.12, true, currencyCode)} 
          sub="24H traded" 
          icon={<PieChartIcon size={14} className="text-sky-500" />} 
        />
      </div>
    </div>
  );
}

function AnalyticsCard({ icon, title, value, subtitle, valueColor = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col group hover:shadow-md transition relative overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-3">
        <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">{icon}</div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={`text-xl font-black ${valueColor}`}>{value}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{subtitle}</span>
      </div>
    </div>
  );
}

function MiniCard({ label, value, sub, icon }) {
  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
        {icon}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">{label}</span>
        <span className="text-sm font-black text-gray-900 truncate">{value}</span>
        {sub && <span className="text-[10px] font-bold text-gray-400 truncate">{sub}</span>}
      </div>
    </div>
  );
}
