import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency.js';
import { useWatchlist } from '../context/WatchlistContext.jsx';
import { api } from '../services/api.js';
import { currency, number, percent } from '../utils/format.js';
import Sparkline from './Sparkline.jsx';

export default function CoinRow({ coin }) {
  const { toggle, isSaved } = useWatchlist();
  const { currencyCode } = useCurrency();
  const navigate = useNavigate();
  const previousPrice = useRef(coin.currentPrice);
  const [flash, setFlash] = useState('');
  const saved = isSaved(coin.id);

  const flashClass = flash === 'up' 
    ? 'bg-mint/10 text-mint border border-mint/20 shadow-[inset_0_0_10px_rgba(47,244,166,0.2)]' 
    : flash === 'down' 
    ? 'bg-roseGlow/10 text-roseGlow border border-roseGlow/20 shadow-[inset_0_0_10px_rgba(255,77,141,0.2)]' 
    : 'bg-white/[0.04] border border-white/5 text-white';

  useEffect(() => {
    if (previousPrice.current === coin.currentPrice) return undefined;

    setFlash(coin.currentPrice > previousPrice.current ? 'up' : 'down');
    previousPrice.current = coin.currentPrice;

    const timer = window.setTimeout(() => setFlash(''), 1000);
    return () => window.clearTimeout(timer);
  }, [coin.currentPrice]);

  return (
    <tr
      className="border-b border-white/5 hover:bg-white/[0.02] transition duration-200 cursor-pointer"
      onClick={() => navigate(`/coin/${coin.id}`)}
    >
      <td className="py-4 pl-4 text-left text-slate-400 font-bold text-xs">{coin.rank}</td>
      <td className="py-4 pr-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!localStorage.getItem('auth_token')) return navigate('/auth');
            toggle(coin);
          }}
          className={`p-1.5 rounded-lg border transition ${saved ? 'bg-amberGlow/10 border-amberGlow/30 text-amberGlow' : 'bg-white/5 border-white/5 text-slate-500 hover:text-amberGlow hover:scale-105'}`}
          title="Toggle watchlist"
        >
          <Star size={15} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </td>
      <td className="py-4">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-3">
            <img src={coin.image} alt="" className="size-9 rounded-full bg-white/5 p-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-sm">{coin.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-white/5 border border-white/5 px-1.5 py-0.5 rounded leading-none">{coin.symbol}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const details = await api.coin(coin.id);
                const url = details.website || `/coin/${coin.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              } catch {
                window.open(`/coin/${coin.id}`, '_blank', 'noopener,noreferrer');
              }
            }}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyanGlow to-blue-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 shadow-[0_0_10px_rgba(40,215,255,0.2)] hover:shadow-[0_0_15px_rgba(40,215,255,0.4)] transition hover:scale-105"
            title={`Buy ${coin.name}`}
          >
            <ShoppingCart size={10} /> Buy
          </button>
        </div>
      </td>
      <td className="py-4 text-right">
        <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs tracking-wide transition-all duration-300 ${flashClass}`}>
          {currency(coin.currentPrice, false, currencyCode)}
        </span>
      </td>
      <td className={`hidden py-4 text-right font-black sm:table-cell text-xs ${coin.change1h >= 0 ? 'text-mint' : 'text-roseGlow'}`}>
        {percent(coin.change1h)}
      </td>
      <td className={`py-4 text-right font-black text-xs ${coin.change24h >= 0 ? 'text-mint' : 'text-roseGlow'}`}>
        {percent(coin.change24h)}
      </td>
      <td className={`hidden py-4 text-right font-black lg:table-cell text-xs ${coin.change7d >= 0 ? 'text-mint' : 'text-roseGlow'}`}>
        {percent(coin.change7d)}
      </td>
      <td className="hidden py-4 text-right text-slate-300 font-medium text-xs xl:table-cell">{currency(coin.marketCap, true, currencyCode)}</td>
      <td className="hidden py-4 text-right text-slate-300 font-medium text-xs xl:table-cell">{currency(coin.volume, true, currencyCode)}</td>
      <td className="hidden py-4 text-right text-slate-300 font-medium text-xs 2xl:table-cell">{number(coin.circulatingSupply)}</td>
      <td className="hidden py-4 pr-4 xl:table-cell">
        <div className="flex justify-end">
          <Sparkline data={coin.sparkline} positive={coin.change7d >= 0} />
        </div>
      </td>
    </tr>
  );
}
