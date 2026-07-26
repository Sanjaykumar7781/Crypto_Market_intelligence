import { Activity, Brain, Gauge, Radio, ShieldCheck, TrendingUp, Waves } from 'lucide-react';
import MarketChart from './MarketChart.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import { currency, number, percent } from '../utils/format.js';

export default function InsightsPanel({ insights, live }) {
  const { currencyCode } = useCurrency();
  const chartData = (insights?.volume?.leaders && insights.volume.leaders.length > 0)
    ? insights.volume.leaders.map((coin) => ({
        time: coin.symbol,
        volume: coin.volume || 0,
      }))
    : [
        { time: 'BTC', volume: 48000000000 },
        { time: 'ETH', volume: 22000000000 },
        { time: 'SOL', volume: 7000000000 },
        { time: 'ADA', volume: 980000000 },
        { time: 'LINK', volume: 1100000000 },
        { time: 'DOGE', volume: 1800000000 },
        { time: 'USDT', volume: 68000000000 },
        { time: 'BNB', volume: 5200000000 },
      ];

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyanGlow">Insights engine</p>
          <h2 className="mt-2 text-3xl font-black">Real-time Market Intelligence</h2>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${live ? 'border-mint/40 bg-sky-50 text-teal-500' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
          <Radio size={14} /> {live ? 'Socket live' : 'Polling'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(insights?.cards || []).map((card) => (
          <div key={card.label} className="metric-card">
            <p className="text-xs font-bold uppercase text-gray-500">{card.label}</p>
            <p className="mt-3 text-xl font-black text-gray-900">{card.value}</p>
            <p className="mt-2 text-sm font-semibold text-sky-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="text-amber-500" />
            <h3 className="text-lg font-extrabold text-gray-900">AI-Style Market Summary</h3>
          </div>
          <p className="text-sm leading-7 text-gray-600">{insights?.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniInsight icon={Gauge} label="Bullish breadth" value={`${insights?.trend?.sentimentScore || 0}%`} />
            <MiniInsight icon={ShieldCheck} label="Support" value={currency(insights?.supportResistance?.support, false, currencyCode)} />
            <MiniInsight icon={TrendingUp} label="Resistance" value={currency(insights?.supportResistance?.resistance, false, currencyCode)} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Waves className="text-sky-500" />
            <h3 className="text-lg font-extrabold text-gray-900">Volume Leaders</h3>
          </div>
          <MarketChart data={chartData} mode="volume" currencyCode={currencyCode} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <InsightList title="Bullish Momentum" coins={insights?.movers?.highMomentum || insights?.movers?.gainers || []} tone="mint" />
        <InsightList title="Bearish Pressure" coins={insights?.movers?.weakMomentum || insights?.movers?.losers || []} tone="rose" />
        <InsightList title="Trending Now" coins={insights?.trending || []} tone="cyan" trending />
      </div>
    </section>
  );
}

function MiniInsight({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm hover:shadow-md transition duration-200">
      <Icon className="text-sky-500" size={18} />
      <p className="mt-3 text-xs font-bold uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-black text-gray-900">{value}</p>
    </div>
  );
}

function InsightList({ title, coins, tone, trending = false }) {
  const toneBadge = tone === 'mint' 
    ? 'bg-[#DCFCE7] text-[#15803D]' 
    : tone === 'rose' 
    ? 'bg-[#FEE2E2] text-[#B91C1C]' 
    : 'bg-cyanGlow/15 text-cyanGlow';
    
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-2">
        <Activity className={tone === 'mint' ? 'text-[#15803D]' : tone === 'rose' ? 'text-[#B91C1C]' : 'text-cyanGlow'} size={20} />
        <h3 className="text-lg font-bold text-textMain">{title}</h3>
      </div>
      <div className="flex flex-col gap-3">
        {coins.slice(0, 6).map((coin, index) => (
          <div key={coin.id || `${coin.name}-${index}`} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-white hover:border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex min-w-0 items-center gap-3">
              <img src={coin.image} alt="" className="size-8 rounded-full border border-gray-100" />
              <div className="min-w-0 flex items-center gap-2">
                <p className="truncate font-bold text-textMain text-sm">{coin.name}</p>
                <p className="text-[10px] font-bold text-textMuted uppercase">{coin.symbol}</p>
              </div>
            </div>
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${toneBadge}`}>
              {trending ? `Rank #${(coin.score || index) + 1}` : (percent(coin.change24h).includes('-') ? percent(coin.change24h) : '+' + percent(coin.change24h))}
            </span>
          </div>
        ))}
      </div>
      {!trending && <p className="mt-4 text-xs font-medium text-textMuted">Combined volume: {number(coins.reduce((sum, coin) => sum + (coin.volume || 0), 0))}</p>}
    </div>
  );
}
