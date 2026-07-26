import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, LineChart } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import MarketChart from '../components/MarketChart.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import { currency } from '../utils/format.js';

// Modular Components
import CoinStats from '../components/coindetails/CoinStats.jsx';
import CoinConverter from '../components/coindetails/CoinConverter.jsx';
import CoinMarkets from '../components/coindetails/CoinMarkets.jsx';
import CoinTokenomics from '../components/coindetails/CoinTokenomics.jsx';
import CoinHolders from '../components/coindetails/CoinHolders.jsx';
import CoinNews from '../components/coindetails/CoinNews.jsx';
import CoinRelated from '../components/coindetails/CoinRelated.jsx';
import CoinAbout from '../components/coindetails/CoinAbout.jsx';
import CoinCommunity from '../components/coindetails/CoinCommunity.jsx';
import CoinDeveloper from '../components/coindetails/CoinDeveloper.jsx';
import CoinSentiment from '../components/coindetails/CoinSentiment.jsx';

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

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        
        {/* Top Header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={coin.image} alt="" className="size-16 rounded-full border-2 border-gray-100 p-1 bg-white" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-gray-900">{coin.name}</h1>
                <span className="text-xs font-bold uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-md">{coin.symbol}</span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md border border-gray-200 shadow-sm">Rank #{coin.marketCapRank || coin.rank || '—'}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-black text-gray-900">{currency(coin.currentPrice, false, currencyCode)}</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-lg border ${coin.change24h >= 0 ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/20' : 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/20'}`}>
                  {coin.change24h >= 0 ? '+' : ''}{(coin.change24h || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              if (!localStorage.getItem('auth_token')) return navigate('/auth');
              toggle(coin);
            }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-secondary px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:shadow-md">
              <Star size={16} fill={isSaved(coin.id) ? 'currentColor' : 'none'} />
              {isSaved(coin.id) ? 'Saved to Watchlist' : 'Add to Watchlist'}
            </button>
          </div>
        </section>

        {/* 2-Column Main Layout */}
        <section className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          
          {/* LEFT COLUMN: Main Data */}
          <div className="flex flex-col gap-6">
            
            <CoinStats coin={coin} />
            
            {/* Chart Section */}
            <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center gap-2">
                  <LineChart className="text-primary size-5" />
                  <h2 className="text-xl font-bold text-gray-900">Live Chart</h2>
                </div>
                <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                  {ranges.map((item) => (
                    <button 
                      key={item} 
                      onClick={() => setRange(item)} 
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${range === item ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      {item}
                    </button>
                  ))}
                  <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                  <button 
                    onClick={() => setChartMode(chartMode === 'price' ? 'volume' : 'price')} 
                    className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-primary bg-primary/5 hover:bg-primary/10"
                  >
                    {chartMode === 'price' ? 'Show Vol' : 'Show Price'}
                  </button>
                </div>
              </div>
              <MarketChart data={chart} mode={chartMode} currencyCode={currencyCode} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <CoinTokenomics coin={coin} />
              <CoinHolders coin={coin} />
            </div>

            <CoinConverter coin={coin} />
            
            <CoinMarkets coin={coin} />

            <CoinNews coin={coin} />
            
            <CoinRelated currentCoinId={coin.id} />

          </div>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="sticky top-24 flex flex-col gap-6">
              <CoinAbout coin={coin} />
              <CoinCommunity coin={coin} />
              <CoinDeveloper coin={coin} />
              <CoinSentiment coin={coin} />
            </div>
          </div>

        </section>

      </div>
    </PageShell>
  );
}
