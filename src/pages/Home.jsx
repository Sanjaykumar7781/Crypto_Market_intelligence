import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, BarChart3, Flame, Globe2, PieChart, TrendingDown, TrendingUp, Zap, Search } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import CoinTable from '../components/CoinTable.jsx';
import MarketChart from '../components/MarketChart.jsx';
import NewsCard from '../components/NewsCard.jsx';
import InsightsPanel from '../components/InsightsPanel.jsx';
import Sparkline from '../components/Sparkline.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSocketMarket } from '../hooks/useSocketMarket.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { currency, number, percent } from '../utils/format.js';

const filters = [
  ['all', 'All'],
  ['gainers', 'Gainers'],
  ['losers', 'Losers'],
  ['large', 'Large Cap'],
  ['mid', 'Mid Cap'],
  ['small', 'Small Cap'],
];

const sortMap = {
  name: 'id_asc',
  current_price: 'market_cap_desc',
  change_24h: 'market_cap_desc',
  market_cap_desc: 'market_cap_desc',
  volume_desc: 'volume_desc',
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('market_cap_desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [priceMax, setPriceMax] = useState('');
  const [trendRange, setTrendRange] = useState('7D');
  const [selectedTrendCoin, setSelectedTrendCoin] = useState('bitcoin');
  const { currency: selectedCurrency, currencyCode } = useCurrency();
  const { snapshot, connected } = useSocketMarket();
  const { data: marketPage, loading } = useAsync(
    () => api.markets({ page, perPage, search: query, sort: sortMap[sort] || sort, category: filter, priceMax, currency: selectedCurrency }),
    [page, perPage, query, sort, filter, priceMax, selectedCurrency],
    30000,
  );
  const { data: global } = useAsync(() => api.global(selectedCurrency), [selectedCurrency], 60000);
  const { data: trending = [] } = useAsync(api.trending, [], 60000);
  const { data: news = [] } = useAsync(() => api.news('crypto', ''), [], 120000);
  const { data: polledInsights } = useAsync(() => api.insights(selectedCurrency), [selectedCurrency], 60000);
  const { data: selectedTrendChart = [] } = useAsync(
    () => api.chart(selectedTrendCoin, trendRange, selectedCurrency),
    [selectedTrendCoin, trendRange, selectedCurrency],
    60000,
  );

  const coins = useMemo(() => {
    // Socket snapshot includes a `currency` field — only use it when it matches
    const socketCurrency = snapshot?.currency || 'usd';
    if (snapshot?.market && selectedCurrency === socketCurrency) return snapshot.market;
    return marketPage?.data || [];
  }, [marketPage, snapshot, selectedCurrency]);
  const pagination = marketPage?.pagination || marketPage?.meta;
  const socketCurrency = snapshot?.currency || 'usd';
  const insights = (selectedCurrency === socketCurrency && snapshot?.insights) || polledInsights;

  useEffect(() => {
    console.debug('Home: coins length =', coins.length, 'source =', marketPage ? 'marketPage' : snapshot ? 'snapshot' : 'none');
  }, [coins, marketPage, snapshot]);

  useEffect(() => {
    if (coins.length > 0 && !coins.some((coin) => coin.id === selectedTrendCoin)) {
      setSelectedTrendCoin(coins[0].id);
    }
  }, [coins, selectedTrendCoin]);

  const topGainers = useMemo(() => [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 4), [coins]);
  const topLosers = useMemo(() => [...coins].sort((a, b) => a.change24h - b.change24h).slice(0, 4), [coins]);
  const chartData = useMemo(() => {
    if (selectedTrendChart.length > 0) {
      return selectedTrendChart;
    }

    const selectedCoin = coins.find((coin) => coin.id === selectedTrendCoin) || coins[0];
    if (selectedCoin?.sparkline && Array.isArray(selectedCoin.sparkline) && selectedCoin.sparkline.length > 0) {
      return selectedCoin.sparkline.map((price, index) => ({
        time: `${index + 1}`,
        price,
        volume: (selectedCoin?.volume || 0) / 20 + index * 1000000,
      }));
    }

    return [
      { time: '1', price: 94000, volume: 22000000000 },
      { time: '2', price: 94400, volume: 23510000000 },
      { time: '3', price: 95800, volume: 25020000000 },
      { time: '4', price: 95200, volume: 26530000000 },
      { time: '5', price: 97300, volume: 28040000000 },
      { time: '6', price: 98500, volume: 29550000000 },
      { time: '7', price: 100800, volume: 31060000000 },
      { time: '8', price: 102700, volume: 32570000000 },
    ];
  }, [selectedTrendChart, selectedTrendCoin, coins]);

  function updateSort(key) {
    setSort(key);
    setPage(1);
  }

  function updateFilter(next) {
    setFilter(next);
    setPage(1);
  }

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-8"
      >
        <section className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <div>
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyanGlow">Real-time crypto intelligence</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-6xl bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent">Crypto Market</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">
                Track live prices, the latest market trends, top gainers, news, sentiment, watchlists, and portfolio signals from one polished fintech dashboard.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={Globe2} label="Global Market Cap" value={currency(global?.marketCap, true, currencyCode)} sub={percent(global?.change24h)} tone="green" />
              <StatCard icon={Activity} label="24h Volume" value={currency(global?.volume, true, currencyCode)} sub={`${number(global?.activeCryptos)} assets`} />
              <StatCard icon={PieChart} label="BTC Dominance" value={`${(global?.btcDominance || 0).toFixed(1)}%`} sub={`ETH ${(global?.ethDominance || 0).toFixed(1)}%`} />
              <StatCard icon={Flame} label="Fear & Greed" value={global?.fearGreed || 0} sub="Greed sentiment" tone="green" />
            </div>
          </div>

          <div className="glass-premium rounded-2xl p-6 relative overflow-hidden shadow-sm border border-gray-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyanGlow/10 blur-3xl pointer-events-none rounded-full" />
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amberGlow/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Zap size={18} />
                </div>
                <div>
                  <h2 className="font-black text-gray-900 text-base tracking-tight">AI Market Pulse</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Real-time AI Sentiment Scan</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-6 text-gray-600">
              {insights?.summary || 'Analyzing market breadth, volume flow, support zones, resistance levels, and trending assets in real time.'}
            </p>
            <div className="mt-5 space-y-2">
              {(Array.isArray(insights?.cards) ? insights.cards : [{label: 'Loading breadth model...'}, {label: 'Scanning volume...'}, {label: 'Mapping support...'}]).slice(0, 3).map((item, idx) => (
                <div key={item.label || idx} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition duration-200">
                  <span className="text-gray-500">{item.label || item}</span>
                  <span className="font-bold text-cyanGlow">{item.detail || 'Loading...'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <InsightsPanel insights={insights} live={connected} />

        <section className="grid gap-4 md:grid-cols-2">
          <MoverPanel title="Top Gainers 24h" icon={TrendingUp} coins={topGainers} positive />
          <MoverPanel title="Top Losers 24h" icon={TrendingDown} coins={topLosers} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_.42fr]">
          <div className="glass-premium rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-gray-900">Coin Trend</h2>
                <p className="text-xs text-gray-500">Select a coin to display its live chart</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="input lg:w-48 bg-white border-gray-200 text-gray-900 rounded-xl font-bold cursor-pointer h-9 text-xs shadow-sm"
                  value={selectedTrendCoin}
                  onChange={(event) => setSelectedTrendCoin(event.target.value)}
                >
                  {(coins || []).map((coin) => (
                    <option key={coin.id} value={coin.id}>
                      {coin.name}
                    </option>
                  ))}
                </select>
                {['1H', '24H', '7D', '1M', '1Y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTrendRange(range)}
                    className={`ghost-button px-3 py-1.5 text-xs rounded-xl ${trendRange === range ? 'border-cyanGlow/60 bg-cyanGlow/15 text-cyanGlow' : ''}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <MarketChart data={chartData} currencyCode={currencyCode} />
            </div>

            <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-9">
              {(() => {
                const selectedCoin = coins.find((c) => c.id === selectedTrendCoin) || coins[0] || {};
                return (
                  <>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">Price</p>
                      <p className="text-sm font-black text-gray-900">{currency(selectedCoin?.currentPrice || 0, false, currencyCode)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">Market Cap</p>
                      <p className="text-sm font-black text-gray-900">{currency(selectedCoin?.marketCap || 0, true, currencyCode)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">Volume 24h</p>
                      <p className="text-sm font-black text-gray-900">{currency(selectedCoin?.volume || 0, true, currencyCode)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">24h Change</p>
                      <p className={`text-sm font-black ${selectedCoin?.change24h >= 0 ? 'text-success' : 'text-danger'}`}>{percent(selectedCoin?.change24h)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">7d Change</p>
                      <p className={`text-sm font-black ${selectedCoin?.change7d >= 0 ? 'text-success' : 'text-danger'}`}>{percent(selectedCoin?.change7d || 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">30d Change</p>
                      <p className={`text-sm font-black ${selectedCoin?.change30d >= 0 ? 'text-success' : 'text-danger'}`}>{percent(selectedCoin?.change30d || 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">24h High</p>
                      <p className="text-sm font-black text-gray-900">{currency(selectedCoin?.high24h || 0, false, currencyCode)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">24h Low</p>
                      <p className="text-sm font-black text-gray-900">{currency(selectedCoin?.low24h || 0, false, currencyCode)}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center items-center text-center hover:shadow-hover transition">
                      <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">Rank</p>
                      <p className="text-sm font-black text-gray-900">{selectedCoin?.rank ? `#${selectedCoin.rank}` : '—'}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-primary" size={20} />
                <h2 className="text-lg font-bold tracking-tight text-textMain">Trending Assets</h2>
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
              {(Array.isArray(trending) ? trending : []).slice(0, 5).map((coinItem) => {
                const coin = (coins || []).find((c) => c.id === coinItem.id) || coinItem;
                const positive = (coin.change24h || 0) >= 0;
                return (
                  <div key={coin.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:bg-white hover:border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer" onClick={() => navigate(`/coin/${coin.id}`)}>
                    <div className="flex items-center gap-3">
                      <img src={coin.image || coin.thumb} alt="" className="w-10 h-10 rounded-full bg-white p-0.5 border border-gray-100" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-textMain text-sm leading-tight">{coin.name}</p>
                          <span className="text-[10px] font-bold text-textMuted uppercase bg-white border border-gray-200 px-1.5 py-0.5 rounded leading-none">{coin.symbol}</span>
                        </div>
                        <p className="text-xs text-textMuted font-medium mt-1">Rank #{coin.marketCapRank || coin.rank || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {coin.sparkline && (
                        <div className="hidden xl:block w-20">
                          <Sparkline data={coin.sparkline} positive={positive} width={80} height={30} />
                        </div>
                      )}
                      
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-textValue text-sm">
                          {coin.currentPrice ? currency(coin.currentPrice, false, currencyCode) : '—'}
                        </span>
                        {coin.change24h !== undefined ? (
                          <span className={`inline-flex items-center justify-center px-1.5 py-0.5 mt-1 rounded text-[10px] font-bold ${positive ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>
                            {positive ? '+' : ''}{percent(coin.change24h)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-textMuted mt-1">Score #{coin.score + 1}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="mb-2 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] items-center">
            <div className="relative w-full">
              <input
                className="input-premium pl-11"
                placeholder="Search all CoinGecko cryptocurrencies..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              <Search className="absolute left-4 top-3.5 text-gray-400 w-4 h-4" />
            </div>

            <select className="input lg:w-36 bg-white border-gray-200 text-gray-900 rounded-xl font-bold cursor-pointer h-11 text-xs shadow-sm" value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
              <option value="250">250 rows</option>
            </select>

            <select className="input lg:w-44 bg-white border-gray-200 text-gray-900 rounded-xl font-bold cursor-pointer h-11 text-xs shadow-sm" value={priceMax} onChange={(event) => { setPriceMax(event.target.value); setPage(1); }}>
              <option value="">Any price</option>
              <option value="1">Under 1 {currencyCode}</option>
              <option value="10">Under 10 {currencyCode}</option>
              <option value="100">Under 100 {currencyCode}</option>
              <option value="1000">Under 1,000 {currencyCode}</option>
            </select>

            <div className="flex overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 h-11 items-center shadow-sm">
              {filters.map(([key, label]) => (
                <button key={key} onClick={() => updateFilter(key)} className={`min-w-max rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${filter === key ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <CoinTable coins={coins} loading={loading} sort={sort} onSort={updateSort} pagination={pagination} onPageChange={setPage} />
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Latest Crypto News</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(Array.isArray(news) ? news : []).slice(0, 4).map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
        </section>
      </motion.div>
    </PageShell>
  );
}

function MoverPanel({ title, icon: Icon, coins, positive = false }) {
  const { currencyCode } = useCurrency();
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <Icon className={positive ? 'text-success' : 'text-danger'} size={20} />
        <h2 className="text-lg font-bold text-textMain tracking-tight">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Array.isArray(coins) ? coins : []).map((coin) => (
          <div
            key={coin.id}
            className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-all duration-300 hover:bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
            onClick={() => navigate(`/coin/${coin.id}`)}
          >
            <div className="flex items-center gap-3">
              <img src={coin.image} alt="" className="w-10 h-10 rounded-full bg-white border border-gray-100 p-0.5" />
              <div>
                <p className="font-bold text-textMain text-base leading-tight">{coin.name}</p>
                <p className="text-xs text-textMuted font-medium uppercase tracking-wider mt-0.5">{coin.symbol}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="font-bold text-textValue text-lg">{currency(coin.currentPrice, false, currencyCode)}</span>
              <span className={`inline-flex items-center justify-center text-sm font-bold px-2.5 py-1 rounded-full ${positive ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]'}`}>
                {positive ? '+' : ''}{percent(coin.change24h)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
