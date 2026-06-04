import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useCurrency } from '../hooks/useCurrency.js';
import { useAsync } from '../hooks/useAsync.js';
import { currency, percent } from '../utils/format.js';

export default function MarketTicker() {
  const { currency: selectedCurrency, currencyCode } = useCurrency();
  const { data } = useAsync(() => api.market(20, selectedCurrency), [selectedCurrency], 45000);
  const coins = data || [];
  const loop = [...coins, ...coins];

  return (
    <div className="fixed inset-x-0 top-16 z-30 w-screen overflow-hidden border-b border-white/10 bg-panel/80 py-2 backdrop-blur-xl">
      <div className="ticker-track flex w-max gap-3">
        {loop.map((coin, index) => (
          <Link key={`${coin.id}-${index}`} to={`/coin/${coin.id}`} className="flex min-w-max items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            <img src={coin.image} alt="" className="size-5 rounded-full" />
            <span className="font-bold">{coin.symbol}</span>
            <span>{currency(coin.currentPrice, false, currencyCode)}</span>
            <span className={coin.change24h >= 0 ? 'text-mint' : 'text-roseGlow'}>{percent(coin.change24h)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
