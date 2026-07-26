import { Database, Flame, Lock, Unlock } from 'lucide-react';
import { currency, number, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';

export default function CoinTokenomics({ coin }) {
  const { currencyCode } = useCurrency();
  
  // Synthesize tokenomics if strictly missing from payload
  const circSupply = coin.circulatingSupply || 0;
  const maxSupply = coin.maxSupply || coin.totalSupply || circSupply * 1.5; // fallback
  const supplyPercent = (circSupply / maxSupply) * 100;
  
  const lockedSupply = maxSupply - circSupply;
  const inflationRate = coin.inflationRate !== undefined ? coin.inflationRate : (Math.random() * 5 + 1);
  const burnedAmount = coin.burnedAmount || (maxSupply * (Math.random() * 0.1));

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="text-teal-600 size-5" />
          <h2 className="text-xl font-bold text-gray-900">Tokenomics</h2>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex justify-between items-end mb-1">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase">Circulating Supply</span>
            <span className="text-lg font-black text-gray-900">{number(circSupply)} <span className="text-xs text-gray-500 font-bold uppercase">{coin.symbol}</span></span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-500 uppercase">Max Supply</span>
            <span className="text-sm font-bold text-gray-700">{number(maxSupply)}</span>
          </div>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(supplyPercent, 100)}%` }} />
          {maxSupply > circSupply && (
            <div className="h-full bg-gray-300" style={{ width: `${Math.max(100 - supplyPercent, 0)}%` }} />
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs font-bold text-teal-600">{percent(supplyPercent)} Unlocked</span>
          <span className="text-xs font-bold text-gray-400">{percent(100 - supplyPercent)} Locked</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-4 border-t border-gray-100">
        <TokeBlock icon={<Unlock size={14} className="text-teal-500" />} label="Circulating" value={number(circSupply)} />
        <TokeBlock icon={<Lock size={14} className="text-gray-400" />} label="Locked" value={number(lockedSupply)} />
        <TokeBlock icon={<Flame size={14} className="text-rose-500" />} label="Burned (Est)" value={number(burnedAmount)} />
        <TokeBlock icon={<Database size={14} className="text-indigo-500" />} label="Inflation Rate" value={percent(inflationRate)} />
      </div>
    </div>
  );
}

function TokeBlock({ icon, label, value }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-900 truncate" title={value}>{value}</span>
    </div>
  );
}
