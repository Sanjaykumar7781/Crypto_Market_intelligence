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
        <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${live ? 'border-mint/40 bg-mint/10 text-mint' : 'border-white/10 bg-white/5 text-slate-400'}`}>
          <Radio size={14} /> {live ? 'Socket live' : 'Polling'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(insights?.cards || []).map((card) => (
          <div key={card.label} className="metric-card">
            <p className="text-xs font-bold uppercase text-slate-400">{card.label}</p>
            <p className="mt-3 text-xl font-black">{card.value}</p>
            <p className="mt-2 text-sm font-semibold text-cyanGlow">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="text-amberGlow" />
            <h3 className="text-lg font-extrabold">AI-Style Market Summary</h3>
          </div>
          <p className="text-sm leading-7 text-slate-300">{insights?.summary}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniInsight icon={Gauge} label="Bullish breadth" value={`${insights?.trend?.sentimentScore || 0}%`} />
            <MiniInsight icon={ShieldCheck} label="Support" value={currency(insights?.supportResistance?.support, false, currencyCode)} />
            <MiniInsight icon={TrendingUp} label="Resistance" value={currency(insights?.supportResistance?.resistance, false, currencyCode)} />
          </div>
        </div>
        <div className="glass rounded-lg p-5">
          <div className="mb-4 flex items-center gap-2">
            <Waves className="text-cyanGlow" />
            <h3 className="text-lg font-extrabold">Volume Leaders</h3>
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
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <Icon className="text-cyanGlow" size={18} />
      <p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function InsightList({ title, coins, tone, trending = false }) {
  const toneClass = tone === 'mint' ? 'text-mint' : tone === 'rose' ? 'text-roseGlow' : 'text-cyanGlow';
  return (
    <div className="glass rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity className={toneClass} />
        <h3 className="text-lg font-extrabold">{title}</h3>
      </div>
      <div className="space-y-3">
        {coins.slice(0, 6).map((coin, index) => (
          <div key={coin.id || `${coin.name}-${index}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <img src={coin.image} alt="" className="size-8 rounded-full" />
              <div className="min-w-0">
                <p className="truncate font-bold">{coin.name}</p>
                <p className="text-xs text-slate-400">{coin.symbol}</p>
              </div>
            </div>
            <span className={`text-sm font-black ${toneClass}`}>
              {trending ? `#${(coin.score || index) + 1}` : percent(coin.change24h)}
            </span>
          </div>
        ))}
      </div>
      {!trending && <p className="mt-4 text-xs text-slate-500">Combined volume: {number(coins.reduce((sum, coin) => sum + (coin.volume || 0), 0))}</p>}
    </div>
  );
}
