import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, ArrowUp, ArrowDown } from 'lucide-react';
import CoinRow from './CoinRow.jsx';
import Skeleton from './Skeleton.jsx';
import { currency } from '../utils/format.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { useWatchlist } from '../context/WatchlistContext.jsx';

const headers = [
  { key: 'rank', label: '#', className: 'w-12 text-left pl-4' },
  { key: 'watch', label: '', className: 'w-10' },
  { key: 'name', label: 'Asset', className: 'text-left' },
  { key: 'current_price', label: 'Price', className: 'text-right' },
  { key: 'change1h', label: '1h', className: 'text-right hidden sm:table-cell' },
  { key: 'change_24h', label: '24h', className: 'text-right' },
  { key: 'change7d', label: '7d', className: 'text-right hidden lg:table-cell' },
  { key: 'market_cap_desc', label: 'Market Cap', className: 'hidden text-right xl:table-cell' },
  { key: 'volume_desc', label: 'Volume(24h)', className: 'hidden text-right xl:table-cell' },
  { key: 'supply', label: 'Supply', className: 'hidden text-right 2xl:table-cell' },
  { key: 'last7d', label: 'Last 7 Days', className: 'hidden py-3 pr-4 text-right xl:table-cell' },
];

export default function CoinTable({ coins, loading, pagination, onPageChange, sort, onSort }) {
  const navigate = useNavigate();
  const { currencyCode } = useCurrency();
  const { toggle, isSaved } = useWatchlist();

  return (
    <div className="glass-premium w-full max-w-full overflow-hidden rounded-2xl border border-white/8 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Live Cryptocurrency Prices</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time asset values and price trajectories</p>
        </div>
        {pagination && (
          <p className="text-xs font-bold text-slate-400 bg-white/5 border border-white/5 px-3 py-1 rounded-lg">
            Page {pagination.page} of {pagination.totalPages} • {pagination.total?.toLocaleString()} Assets
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3.5 p-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block max-w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm md:min-w-[1200px] table-auto">
              <thead className="bg-white/[0.02] border-b border-white/5 text-xs font-black uppercase text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  {headers.map(({ key, label, className }) => {
                    const isSortable = key !== 'watch' && key !== 'last7d';
                    const isLeft = className.includes('text-left');
                    const isRight = className.includes('text-right');
                    const alignClass = isLeft ? 'justify-start' : isRight ? 'justify-end' : 'justify-center';

                    return (
                      <th
                        key={key}
                        className={`py-4 px-3 select-none ${isSortable ? 'cursor-pointer hover:text-white transition duration-200' : ''} ${className}`}
                        onClick={() => isSortable && onSort?.(key)}
                      >
                        <div className={`flex items-center gap-1.5 ${alignClass}`}>
                          <span>{label}</span>
                          {isSortable && sort === key && <ArrowUp size={12} className="text-cyanGlow" />}
                          {isSortable && sort === key + '_desc' && <ArrowDown size={12} className="text-cyanGlow" />}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#050505]/20">
                {coins.map((coin) => (
                  <CoinRow key={coin.id} coin={coin} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="md:hidden divide-y divide-white/5 bg-[#050505]/10">
            {coins.map((coin) => {
              const saved = isSaved(coin.id);
              const positive = coin.change24h >= 0;
              return (
                <div
                  key={coin.id}
                  className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition duration-200 cursor-pointer"
                  onClick={() => navigate(`/coin/${coin.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!localStorage.getItem('auth_token')) return navigate('/auth');
                        toggle(coin);
                      }}
                      className={`p-1.5 rounded-lg border transition ${saved ? 'bg-amberGlow/10 border-amberGlow/30 text-amberGlow' : 'bg-white/5 border-white/5 text-slate-500 hover:text-amberGlow'}`}
                      title="Toggle watchlist"
                    >
                      <Star size={16} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                    <img src={coin.image} alt="" className="size-10 rounded-full bg-white/5 p-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white text-sm leading-none">{coin.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">{coin.symbol}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Rank #{coin.rank || coin.marketCapRank || '—'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <p className="font-extrabold text-white text-sm">{currency(coin.currentPrice, false, currencyCode)}</p>
                    <span className={`text-xs font-black ${positive ? 'text-mint' : 'text-roseGlow'}`}>
                      {positive ? '+' : ''}{coin.change24h?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 p-4 bg-white/[0.01]">
          <button
            className="btn-premium px-4 py-2 text-xs"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange?.(pagination.page - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-xs font-bold text-slate-400">
            {pagination.perPage} per page
          </span>
          <button
            className="btn-premium px-4 py-2 text-xs"
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange?.(pagination.page + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
