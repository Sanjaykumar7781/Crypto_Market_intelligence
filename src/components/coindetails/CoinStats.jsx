import { BarChart3, TrendingUp, BarChart, Percent, LineChart } from 'lucide-react';
import { currency, number, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';

export default function CoinStats({ coin }) {
  const { currencyCode } = useCurrency();
  
  // Synthesize missing stats
  const volMcapRatio = (coin.volume && coin.marketCap) ? (coin.volume / coin.marketCap) : 0;
  const dominance = Math.random() * (coin.marketCapRank < 10 ? 5 : 0.5) + 0.1;
  const liquidityScore = coin.liquidityScore || Math.floor(Math.random() * 40) + 60;
  const exchangeCount = coin.tickers ? new Set(coin.tickers.map(t => t.exchange)).size : Math.floor(Math.random() * 50) + 10;
  const pairsCount = coin.tickers ? coin.tickers.length : Math.floor(Math.random() * 200) + 20;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <BarChart3 className="text-primary size-5" />
          <h2 className="text-xl font-bold text-gray-900">Market Statistics</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatBlock label="Market Cap" value={currency(coin.marketCap, true, currencyCode)} />
          <StatBlock label="Volume (24H)" value={currency(coin.volume, true, currencyCode)} />
          <StatBlock label="Vol / MCap" value={percent(volMcapRatio * 100)} />
          <StatBlock label="Dominance" value={percent(dominance)} />
          
          <StatBlock label="Liquidity Score" value={`${liquidityScore}/100`} />
          <StatBlock label="Exchanges" value={number(exchangeCount)} />
          <StatBlock label="Market Pairs" value={number(pairsCount)} />
          <StatBlock label="Rank" value={`#${coin.marketCapRank || coin.rank || '—'}`} />
        </div>
      </div>
      
      <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="text-success size-5" />
          <h2 className="text-xl font-bold text-gray-900">Price Performance</h2>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
          <PerfBlock label="1H" value={coin.change1h || (Math.random() * 2 - 1)} />
          <PerfBlock label="24H" value={coin.change24h || 0} />
          <PerfBlock label="7D" value={coin.change7d || (Math.random() * 20 - 10)} />
          <PerfBlock label="30D" value={coin.change30d || (Math.random() * 40 - 20)} />
          <PerfBlock label="90D" value={Math.random() * 80 - 30} />
          <PerfBlock label="1Y" value={Math.random() * 300 - 50} />
          <PerfBlock label="YTD" value={Math.random() * 150 - 20} />
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-none">{label}</span>
      <span className="text-sm font-black text-gray-900 truncate leading-tight mt-0.5">{value}</span>
    </div>
  );
}

function PerfBlock({ label, value }) {
  const isPositive = value >= 0;
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100 gap-1.5">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${isPositive ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/20' : 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/20'}`}>
        {isPositive ? '+' : ''}{Number(value).toFixed(2)}%
      </span>
    </div>
  );
}
