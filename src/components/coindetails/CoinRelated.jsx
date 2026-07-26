import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { currency } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';
import { useAsync } from '../../hooks/useAsync.js';
import { api } from '../../services/api.js';

export default function CoinRelated({ currentCoinId }) {
  const { currencyCode } = useCurrency();
  const { data: trending = [], loading } = useAsync(() => api.trending(), []);

  // Filter out the current coin if it's in trending
  const relatedCoins = trending.filter(c => c.id !== currentCoinId).slice(0, 6);

  if (loading || relatedCoins.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm mt-6">
      <div className="mb-6 flex items-center gap-2">
        <Layers className="text-gray-400 size-5" />
        <h2 className="text-xl font-bold text-gray-900">Similar Assets</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {relatedCoins.map(coin => {
          const positive = coin.change24h >= 0;
          return (
            <Link 
              key={coin.id} 
              to={`/coin/${coin.id}`}
              className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2 mb-3">
                <img src={coin.image} alt="" className="size-8 rounded-full bg-white border border-gray-200 p-0.5 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 leading-tight truncate w-20">{coin.name}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{coin.symbol}</span>
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-1">
                <span className="text-sm font-black text-gray-900 truncate">
                  {currency(coin.currentPrice || coin.price || 0, false, currencyCode)}
                </span>
                <span className={`text-xs font-bold ${positive ? 'text-success' : 'text-danger'}`}>
                  {positive ? '+' : ''}{(coin.change24h || 0).toFixed(2)}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
