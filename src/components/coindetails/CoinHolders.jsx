import { Wallet, PieChart } from 'lucide-react';
import { number, percent } from '../../utils/format.js';

export default function CoinHolders({ coin }) {
  // Generate realistic mock holder data
  const holders = Math.floor(Math.random() * 2000000) + 50000;
  const activeAddresses = Math.floor(holders * (Math.random() * 0.1 + 0.01));
  const top10Percent = Math.random() * 40 + 10;
  const whaleHoldings = Math.random() * 30 + 5;
  const tx24h = Math.floor(Math.random() * 500000) + 10000;

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Wallet className="text-orange-500 size-5" />
        <h2 className="text-xl font-bold text-gray-900">Holders & Activity</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <HolderStat label="Total Holders" value={number(holders)} />
        <HolderStat label="Active Addresses (24H)" value={number(activeAddresses)} />
        <HolderStat label="Transactions (24H)" value={number(tx24h)} />
        <HolderStat label="Top 10 Holders" value={percent(top10Percent)} />
      </div>

      <div className="pt-5 border-t border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
            <PieChart size={14} className="text-gray-400" /> Ownership Distribution
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <DistributionBar label="Retail" pct={100 - top10Percent - whaleHoldings} color="bg-blue-500" />
          <DistributionBar label="Whales (>1%)" pct={whaleHoldings} color="bg-amber-500" />
          <DistributionBar label="Top 10" pct={top10Percent} color="bg-rose-500" />
        </div>
      </div>
    </div>
  );
}

function HolderStat({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-lg font-black text-gray-900">{value}</span>
    </div>
  );
}

function DistributionBar({ label, pct, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-gray-500 w-20">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-black text-gray-900 w-12 text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}
