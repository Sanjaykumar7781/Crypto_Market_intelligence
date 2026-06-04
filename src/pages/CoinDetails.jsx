import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bell,
  Brain,
  Building2,
  LineChart,
  Star,
  Activity,
  Award,
  Cpu,
  Clock,
  DollarSign,
  Database,
  RefreshCw,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import MarketChart from '../components/MarketChart.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { currency, number, percent } from '../utils/format.js';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import { useCurrency } from '../hooks/useCurrency.js';

const ranges = ['1H', '24H', '7D', '1M', '1Y'];

export default function CoinDetails() {
  const { id } = useParams();
  const [range, setRange] = useState('7D');
  const [chartMode, setChartMode] = useState('price');
  const { currency: selectedCurrency, currencyCode } = useCurrency();
  const { data: coin, loading } = useAsync(() => api.coin(id, selectedCurrency), [id, selectedCurrency], 30000);
  const { data: chart = [] } = useAsync(() => api.chart(id, range, selectedCurrency), [id, range, selectedCurrency], 30000);
  const { toggle, isSaved } = useWatchlist();
  const navigate = useNavigate();

  if (loading || !coin) {
    return <PageShell><Skeleton className="h-[520px]" /></PageShell>;
  }

  const externalLinks = [
    { label: 'Official website', href: coin.website },
    ...(coin.explorers?.map((url, index) => ({ label: `Explorer ${index + 1}`, href: url })) || []),
  ].filter((link) => link.href);

  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[1fr_.38fr]">
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <img src={coin.image} alt="" className="size-16 rounded-full" />
              <div>
                <p className="text-sm font-bold uppercase text-cyanGlow">{coin.symbol}</p>
                <h1 className="text-4xl font-black">{coin.name}</h1>
                <p className="mt-1 text-sm text-slate-400">Rank #{coin.marketCapRank || '—'}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {externalLinks.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="ghost-button px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {link.label}
                </a>
              ))}
              <button onClick={() => {
                if (!localStorage.getItem('auth_token')) return navigate('/auth');
                toggle(coin);
              }} className="gradient-button">
                <Star size={18} fill={isSaved(coin.id) ? 'currentColor' : 'none'} />
                {isSaved(coin.id) ? 'Saved' : 'Add Watchlist'}
              </button>
            </div>
          </div>

          <div className="mt-5 max-w-3xl space-y-4 text-slate-300">
            {coin.description && <p>{coin.description}</p>}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoRow label="Category" value={coin.categories?.join(', ') || '—'} />
              <InfoRow label="Launch date" value={coin.genesisDate || 'Unknown'} />
              <InfoRow label="Hashing" value={coin.hashingAlgorithm || 'N/A'} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Current price" value={currency(coin.currentPrice, false, currencyCode)} />
            <Metric label="1h change" value={percent(coin.change1h)} tone={coin.change1h >= 0 ? 'text-mint' : 'text-roseGlow'} />
            <Metric label="24h change" value={percent(coin.change24h)} tone={coin.change24h >= 0 ? 'text-mint' : 'text-roseGlow'} />
            <Metric label="7d change" value={percent(coin.change7d)} tone={coin.change7d >= 0 ? 'text-mint' : 'text-roseGlow'} />
            <Metric label="30d change" value={percent(coin.change30d)} tone={coin.change30d >= 0 ? 'text-mint' : 'text-roseGlow'} />
            <Metric label="1y change" value={percent(coin.change1y)} tone={coin.change1y >= 0 ? 'text-mint' : 'text-roseGlow'} />
            <Metric label="Market cap" value={currency(coin.marketCap, true, currencyCode)} />
            <Metric label="Volume" value={currency(coin.volume, true, currencyCode)} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="text-amberGlow" />
              <h2 className="text-lg font-extrabold">Price Prediction</h2>
            </div>
            <p className="text-sm leading-6 text-slate-300">
              AI-style projection: neutral-to-bullish while price holds above recent demand. Upside improves above {currency(coin.high24h, false, currencyCode)}; downside watch is {currency(coin.low24h, false, currencyCode)}.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Bullish votes" value={`${coin.sentimentUp || 0}%`} tone="text-mint" />
              <Metric label="Bearish votes" value={`${coin.sentimentDown || 0}%`} tone="text-roseGlow" />
            </div>
          </div>

          <div className="glass rounded-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
            <div className="mb-5 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyanGlow/10 text-cyanGlow shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <Activity size={20} />
              </div>
              <h2 className="text-lg font-black tracking-tight">{coin.name} Price & Market Stats</h2>
            </div>
            
            <div className="space-y-1.5">
              <StatRow
                icon={DollarSign}
                iconColor="text-cyanGlow"
                label={`${coin.name} Price`}
                value={currency(coin.currentPrice, false, currencyCode)}
              />
              <StatRow
                icon={TrendingUp}
                iconColor="text-cyanGlow"
                label={`${coin.name} Market Cap`}
                value={currency(coin.marketCap, false, currencyCode)}
              />
              <StatRow
                icon={Award}
                iconColor="text-amberGlow"
                label={`${coin.name} Market Cap Rank`}
                value={coin.marketCapRank ? `#${coin.marketCapRank}` : '—'}
              />
              <StatRow
                icon={Database}
                iconColor="text-slate-400"
                label={`${coin.name} Total Supply`}
                value={coin.totalSupply ? `${number(coin.totalSupply)} ${coin.symbol.toUpperCase()}` : 'N/A'}
              />
              <StatRow
                icon={RefreshCw}
                iconColor="text-mint"
                label={`${coin.name} Circulating Supply`}
                value={coin.circulatingSupply ? `${number(coin.circulatingSupply)} ${coin.symbol.toUpperCase()}` : '—'}
              />
              <StatRow
                icon={LineChart}
                iconColor="text-cyanGlow"
                label={`${coin.name} Trading Volume`}
                value={currency(coin.volume, false, currencyCode)}
              />
              <StatRow
                icon={ArrowUpDown}
                iconColor="text-pink-400"
                label={`${coin.name} 24h High / 24h Low`}
                value={`${currency(coin.high24h, false, currencyCode)} / ${currency(coin.low24h, false, currencyCode)}`}
              />
              <StatRow
                icon={ArrowUpRight}
                iconColor="text-mint"
                label={`${coin.name} All-Time High`}
                value={
                  <div className="flex items-center justify-end gap-2">
                    <span>{currency(coin.ath, false, currencyCode)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${coin.athChangePercentage >= 0 ? 'bg-mint/10 text-mint' : 'bg-roseGlow/10 text-roseGlow'}`}>
                      {percent(coin.athChangePercentage)}
                    </span>
                  </div>
                }
              />
              <StatRow
                icon={ArrowDownRight}
                iconColor="text-roseGlow"
                label={`${coin.name} All-Time Low`}
                value={
                  <div className="flex items-center justify-end gap-2">
                    <span>{currency(coin.atl, false, currencyCode)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${coin.atlChangePercentage >= 0 ? 'bg-mint/10 text-mint' : 'bg-roseGlow/10 text-roseGlow'}`}>
                      {percent(coin.atlChangePercentage)}
                    </span>
                  </div>
                }
              />
              <StatRow
                icon={Cpu}
                iconColor="text-cyanGlow"
                label={`${coin.name} Hashing Algorithm`}
                value={coin.hashingAlgorithm || 'N/A'}
              />
              <StatRow
                icon={Clock}
                iconColor="text-amberGlow"
                label={`${coin.name} Block Time`}
                value={coin.blockTime ? `${coin.blockTime} Minutes` : '0 Minutes'}
              />
            </div>
          </div>

          <div className="glass rounded-lg p-5">
            <h2 className="mb-4 text-lg font-extrabold">Supply & valuation</h2>
            <Metric label="Circulating" value={number(coin.circulatingSupply)} />
            <Metric label="Total" value={coin.totalSupply ? number(coin.totalSupply) : 'N/A'} />
            <Metric label="Max" value={coin.maxSupply ? number(coin.maxSupply) : 'Uncapped'} />
            <Metric label="FDV" value={coin.fullyDilutedValuation ? currency(coin.fullyDilutedValuation, true, currencyCode) : 'N/A'} />
          </div>
          <div className="glass rounded-lg p-5">
            <h2 className="mb-4 text-lg font-extrabold">Project insights</h2>
            <div className="grid gap-3">
              <InfoRow label="Developer score" value={coin.developerScore !== undefined ? `${coin.developerScore}` : 'N/A'} />
              <InfoRow label="Community score" value={coin.communityScore !== undefined ? `${coin.communityScore}` : 'N/A'} />
              <InfoRow label="Public interest" value={coin.publicInterestScore !== undefined ? `${coin.publicInterestScore}` : 'N/A'} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.36fr]">
        <div className="glass rounded-lg p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="text-cyanGlow" />
              <h2 className="text-lg font-extrabold">Live Chart</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {ranges.map((item) => (
                <button key={item} onClick={() => setRange(item)} className={`ghost-button px-3 py-1.5 ${range === item ? 'border-cyanGlow/60 text-cyanGlow' : ''}`}>{item}</button>
              ))}
              <button onClick={() => setChartMode(chartMode === 'price' ? 'volume' : 'price')} className="ghost-button px-3 py-1.5">
                {chartMode === 'price' ? 'Volume' : 'Price'}
              </button>
            </div>
          </div>
          <div className="mt-5">
            <MarketChart data={chart} mode={chartMode} currencyCode={currencyCode} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="24h High" value={currency(coin.high24h, false, currencyCode)} />
            <Metric label="24h Low" value={currency(coin.low24h, false, currencyCode)} />
            <Metric label="Market Cap" value={currency(coin.marketCap, true, currencyCode)} />
            <Metric label="Volume 24h" value={currency(coin.volume, true, currencyCode)} />
            <Metric label="7d Change" value={percent(coin.change7d)} tone={coin.change7d >= 0 ? 'text-mint' : 'text-roseGlow'} />
            <Metric label="Rank" value={coin.marketCapRank ? `#${coin.marketCapRank}` : '—'} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="text-mint" />
              <h2 className="text-lg font-extrabold">External links</h2>
            </div>
            <div className="grid gap-3">
              {externalLinks.length > 0 ? externalLinks.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
                  {link.label}
                </a>
              )) : <p className="text-sm text-slate-400">No official links available.</p>}
            </div>
          </div>
          <div className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="text-cyanGlow" />
              <h2 className="text-lg font-extrabold">Explorer URLs</h2>
            </div>
            {coin.explorers?.length ? (
              <div className="grid gap-3">
                {coin.explorers.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
                    {url}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Explorer data not available.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 glass rounded-lg p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="text-cyanGlow" />
          <h2 className="text-lg font-extrabold">Exchange Listings</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {coin.tickers?.map((ticker) => (
            <div key={`${ticker.exchange}-${ticker.pair}`} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="font-bold">{ticker.exchange}</p>
              <p className="mt-1 text-sm text-slate-400">{ticker.pair}</p>
              <p className="mt-3 text-sm font-bold text-cyanGlow">{number(ticker.volume)} volume</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function Metric({ label, value, tone = 'text-white' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function StatRow({ icon: Icon, iconColor, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 hover:bg-white/[0.02] px-2 rounded-lg transition-all duration-200 group">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`p-1.5 rounded-md ${iconColor} bg-white/5 group-hover:bg-white/10 group-hover:scale-105 transition-all duration-200`}>
            <Icon size={14} />
          </div>
        )}
        <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
      </div>
      <div className="text-right font-semibold text-sm text-slate-100 group-hover:text-white transition-colors">{value}</div>
    </div>
  );
}
