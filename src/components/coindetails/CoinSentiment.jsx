import { Activity, Flame, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { percent } from '../../utils/format.js';

export default function CoinSentiment({ coin }) {
  const sentimentUp = coin.sentimentUp !== undefined ? coin.sentimentUp : Math.floor(Math.random() * 40) + 40;
  const sentimentDown = 100 - sentimentUp;
  
  const fearGreed = Math.floor(Math.random() * 100);
  let fgLabel = 'Neutral';
  let fgColor = 'text-warning';
  if (fearGreed >= 75) { fgLabel = 'Extreme Greed'; fgColor = 'text-success'; }
  else if (fearGreed >= 55) { fgLabel = 'Greed'; fgColor = 'text-success'; }
  else if (fearGreed <= 25) { fgLabel = 'Extreme Fear'; fgColor = 'text-danger'; }
  else if (fearGreed <= 45) { fgLabel = 'Fear'; fgColor = 'text-danger'; }

  const whaleActivity = Math.floor(Math.random() * 100);

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-warning size-5" />
          <h2 className="text-xl font-bold text-gray-900">Market Sentiment</h2>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        {/* Fear and Greed */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fear & Greed Index</span>
            <span className={`text-lg font-black ${fgColor}`}>{fgLabel}</span>
          </div>
          <div className="size-12 rounded-full border-4 border-gray-200 flex items-center justify-center font-black text-gray-900 shadow-inner bg-white">
            {fearGreed}
          </div>
        </div>

        {/* Bull / Bear Ratio */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-gray-500 uppercase">Bull/Bear Ratio</span>
            <span className="text-sm font-black text-gray-900">{(sentimentUp / Math.max(1, sentimentDown)).toFixed(2)}x</span>
          </div>
          <div className="h-3 w-full bg-danger rounded-full overflow-hidden flex">
            <div className="h-full bg-success transition-all duration-1000" style={{ width: `${sentimentUp}%` }} />
          </div>
          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-1 text-success font-bold text-xs"><TrendingUp size={12}/> {percent(sentimentUp)} Bullish</div>
            <div className="flex items-center gap-1 text-danger font-bold text-xs">{percent(sentimentDown)} Bearish <TrendingDown size={12}/></div>
          </div>
        </div>

        {/* Other Sentiments */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
          <SentimentStat icon={<Eye size={14} className="text-blue-500" />} label="Social Volume" value="High" />
          <SentimentStat icon={<Flame size={14} className="text-amber-500" />} label="Whale Activity" value={`${whaleActivity}/100`} />
        </div>
      </div>
    </div>
  );
}

function SentimentStat({ icon, label, value }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-white rounded-xl border border-gray-200 shadow-sm text-center items-center justify-center">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-900">{value}</span>
    </div>
  );
}
