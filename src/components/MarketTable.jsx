import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sparkline from './Sparkline.jsx';
import { Star, ChevronLeft, ChevronRight, Search, ShoppingCart } from 'lucide-react';
import { api } from '../services/api.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { useWatchlist } from '../context/WatchlistContext.jsx';

// Premium Market Table Component
export default function MarketTable() {
  const navigate = useNavigate();
  const { currencyCode } = useCurrency();
  const { items: watchItems, toggle: toggleWatch } = useWatchlist();

  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [, setSortDir] = useState('desc');

  const categories = ['all', 'layer1', 'defi', 'meme', 'ai', 'stablecoins'];

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        perPage,
        search,
        sort: sortBy,
        category: category === 'all' ? undefined : category,
        currency: currencyCode?.toLowerCase() || 'usd',
      };

      const resp = await api.markets(params);
      // resp has { data, pagination }
      const data = resp?.data || resp?.data?.data || resp;
      const pagination = resp?.pagination || resp?.data?.pagination || {};
      setCoins(data || []);
      setTotalPages(pagination.totalPages || Math.max(1, Math.ceil((pagination.total || (data?.length || 0)) / perPage)));
    } catch (err) {
      console.error('Market fetch failed', err);
      setCoins([]);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, category, sortBy, currencyCode]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const onSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const onCategory = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const onSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortBy(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const memoizedRows = useMemo(() => coins, [coins]);

  const formatCurrency = (v) => {
    if (v === undefined || v === null) return '—';
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumberShort = (v) => {
    if (v === undefined || v === null) return '—';
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    return `${Number(v).toLocaleString()}`;
  };

  const Trend = ({ value }) => {
    const num = Number(value ?? 0);
    const positive = num >= 0;
    return (
      <div className={`flex items-center gap-1 font-medium ${positive ? 'text-mint' : 'text-roseGlow'}`}>
        <span className="text-xs">{positive ? '▲' : '▼'}</span>
        <span className="text-sm">{Math.abs(num).toFixed(2)}%</span>
      </div>
    );
  };


  return (
    <div className="w-full">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 items-center">
        <div className="relative col-span-1 md:col-span-2 lg:col-span-3">
          <Search className="absolute left-3 top-3 text-slate-400" />
          <input
            placeholder="Search coins by name or symbol"
            value={search}
            onChange={onSearch}
            className="w-full rounded-full bg-[#0b1220] border border-white/6 px-12 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div className="flex gap-2 items-center">
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="input-field">
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <select value={category} onChange={(e) => onCategory(e.target.value)} className="input-field">
            {categories.map((c) => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full min-w-[1100px] table-auto">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4"> </th>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4 text-left">Coin</th>
                <th className="py-3 px-4">Sym</th>
                <th className="py-3 px-4"> </th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => onSort('price')}>Price</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => onSort('change1h')}>1H</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => onSort('change24h')}>24H</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => onSort('change7d')}>7D</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => onSort('market_cap')}>Market Cap</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => onSort('volume')}>24H Vol</th>
                <th className="py-3 px-4">Supply</th>
                <th className="py-3 px-4">7d</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td colSpan={13} className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 w-full bg-white/6 rounded mb-2" />
                        <div className="h-4 w-3/4 bg-white/6 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                memoizedRows.map((coin) => {
                  const up7d = (coin.change7d ?? 0) >= 0;
                  const isFavorited = watchItems.some((w) => (w.coinId || w.id) === coin.id || w.id === coin.id);
                  return (
                    <tr key={coin.id} className="group hover:bg-white/3 transition-shadow border-t border-white/5">
                      <td className="py-3 px-4">
                        <button onClick={() => toggleWatch({ coinId: coin.id, symbol: coin.symbol, name: coin.name, image: coin.image })} className="p-1 rounded-full hover:bg-white/5">
                          <Star className={`h-4 w-4 ${isFavorited ? 'text-cyan-400' : 'text-slate-400'}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{coin.rank || coin.marketCapRank || '—'}</td>
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={coin.image} alt="" className="w-8 h-8 rounded-full bg-white/5" />
                        <div>
                          <div className="font-semibold text-slate-100">{coin.name}</div>
                          <div className="text-xs text-slate-400">{coin.symbol}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{coin.symbol}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => navigate(`/coin/${coin.id}`)} className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 font-semibold hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)]">
                          <div className="flex items-center gap-2"><ShoppingCart size={14} />Buy</div>
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-100">{formatCurrency(coin.currentPrice)}</td>
                      <td className="py-3 px-4">{<Trend value={coin.change1h} />}</td>
                      <td className="py-3 px-4">{<Trend value={coin.change24h} />}</td>
                      <td className="py-3 px-4">{<Trend value={coin.change7d} />}</td>
                      <td className="py-3 px-4">{formatCurrency(coin.marketCap)}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{formatNumberShort(coin.volume)}</div>
                        <div className="text-xs text-slate-500">24h</div>
                      </td>
                      <td className="py-3 px-4 w-36">
                        <div className="text-sm">{coin.circulatingSupply ? `${(coin.circulatingSupply).toLocaleString()} ${coin.symbol}` : '—'}</div>
                        <div className="h-2 bg-white/6 rounded mt-2 overflow-hidden">
                          <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, (coin.circulatingSupply / (coin.totalSupply || coin.circulatingSupply || 1)) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Sparkline data={coin.sparkline} positive={up7d} width={144} height={40} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet - card layout */}
        <div className="md:hidden">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-white/6 animate-pulse">
                <div className="h-6 w-3/5 bg-white/6 rounded mb-2" />
                <div className="h-4 w-full bg-white/6 rounded" />
              </div>
            ))
          ) : (
            memoizedRows.map((coin) => (
              <div key={coin.id} className="p-4 border-b border-white/6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={coin.image} alt="" className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="font-semibold">{coin.name} <span className="text-xs text-slate-400">{coin.symbol}</span></div>
                    <div className="text-sm text-slate-400">{formatCurrency(coin.currentPrice)}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm font-semibold">{coin.change24h >= 0 ? <span className="text-mint">+{coin.change24h.toFixed(2)}%</span> : <span className="text-roseGlow">{coin.change24h.toFixed(2)}%</span>}</div>
                  <button onClick={() => navigate(`/coin/${coin.id}`)} className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 text-xs font-semibold">Buy</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="p-2 rounded-md hover:bg-white/5"><ChevronLeft /></button>
          <span>Page {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="p-2 rounded-md hover:bg-white/5"><ChevronRight /></button>
        </div>

        <div className="text-sm text-slate-400">Showing <strong className="text-slate-200">{coins.length}</strong> coins</div>
      </div>
    </div>
  );
}
