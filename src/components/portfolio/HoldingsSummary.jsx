import { Wallet, TrendingUp, TrendingDown, Target, PieChart } from 'lucide-react';
import { currency, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';

export default function HoldingsSummary({ holdingsWithPrice, totalValue, totalCost, profitLoss, profitPct }) {
  const { currencyCode } = useCurrency();

  const sortedByGain = [...holdingsWithPrice].sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
  const sortedByValue = [...holdingsWithPrice].sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount));

  const bestPerformer = sortedByGain[0] || null;
  const worstPerformer = sortedByGain[sortedByGain.length - 1] || null;
  const largestHolding = sortedByValue[0] || null;
  const smallestHolding = sortedByValue[sortedByValue.length - 1] || null;

  const divScore = holdingsWithPrice.length > 0 
    ? Math.min(100, Math.round((Math.min(holdingsWithPrice.length, 10) / 10) * 100)) 
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      <SummaryCard 
        label="Total Holdings" 
        value={holdingsWithPrice.length} 
        icon={<Wallet size={14} className="text-gray-500" />} 
      />
      
      <SummaryCard 
        label="Overall ROI" 
        value={`${profitPct >= 0 ? '+' : ''}${percent(profitPct)}`} 
        icon={profitPct >= 0 ? <TrendingUp size={14} className="text-teal-500" /> : <TrendingDown size={14} className="text-rose-500" />} 
        valueColor={profitPct >= 0 ? 'text-teal-500' : 'text-rose-500'}
      />
      
      <SummaryCard 
        label="Diversification" 
        value={`${divScore}/100`} 
        icon={<PieChart size={14} className="text-purple-500" />} 
        valueColor="text-purple-600"
      />
      
      <div className="col-span-2 grid grid-cols-2 gap-3">
        <SummaryCard 
          label="Best Performer" 
          value={bestPerformer?.symbol || 'N/A'} 
          sub={bestPerformer ? `+${(bestPerformer.change24h || 0).toFixed(2)}%` : ''} 
          icon={<Target size={14} className="text-sky-500" />} 
        />
        <SummaryCard 
          label="Largest Asset" 
          value={largestHolding?.symbol || 'N/A'} 
          sub={largestHolding ? currency(largestHolding.currentPrice * largestHolding.amount, false, currencyCode) : ''} 
          icon={<Wallet size={14} className="text-amber-500" />} 
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, valueColor = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-gray-300 transition">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-lg font-black ${valueColor} truncate`}>{value}</span>
        {sub && <span className="text-xs font-bold text-gray-400 mb-0.5 truncate max-w-[60px]">{sub}</span>}
      </div>
    </div>
  );
}
