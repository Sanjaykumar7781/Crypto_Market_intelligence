import { useState } from 'react';
import { ArrowLeftRight, Calculator } from 'lucide-react';
import { currency } from '../../utils/format.js';

export default function CoinConverter({ coin }) {
  const [amount, setAmount] = useState('1');
  const [targetCurrency, setTargetCurrency] = useState('usd');
  
  // Mock conversion rates for demo purposes if not strictly USD
  const rates = {
    usd: coin.currentPrice || 0,
    eur: (coin.currentPrice || 0) * 0.92,
    gbp: (coin.currentPrice || 0) * 0.79,
    inr: (coin.currentPrice || 0) * 83.15,
    btc: (coin.currentPrice || 0) / 65000,
    eth: (coin.currentPrice || 0) / 3500,
    bnb: (coin.currentPrice || 0) / 600,
    usdt: coin.currentPrice || 0,
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const convertedAmount = Number(amount) * (rates[targetCurrency] || 0);

  const formatConverted = (val, curr) => {
    if (['btc', 'eth', 'bnb'].includes(curr)) {
      return val.toFixed(6) + ' ' + curr.toUpperCase();
    }
    return currency(val, false, curr);
  };

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Calculator className="text-primary size-5" />
        <h2 className="text-lg font-bold text-gray-900">{coin.symbol?.toUpperCase()} to Currency Converter</h2>
      </div>
      
      <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="flex-1 w-full bg-white rounded-lg border border-gray-200 p-2 px-3 flex items-center gap-3">
          <img src={coin.image} alt={coin.symbol} className="size-6 rounded-full" />
          <div className="flex flex-col flex-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{coin.symbol}</span>
            <input 
              type="text" 
              value={amount} 
              onChange={handleAmountChange}
              className="w-full font-bold text-gray-900 bg-transparent focus:outline-none"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="size-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shrink-0 shadow-sm z-10 md:-mx-8">
          <ArrowLeftRight size={14} className="text-gray-400" />
        </div>
        
        <div className="flex-1 w-full bg-white rounded-lg border border-gray-200 p-2 px-3 flex items-center gap-3">
          <select 
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-md py-1 px-2 focus:outline-none cursor-pointer"
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
            <option value="inr">INR</option>
            <option value="btc">BTC</option>
            <option value="eth">ETH</option>
            <option value="bnb">BNB</option>
            <option value="usdt">USDT</option>
          </select>
          <div className="flex flex-col flex-1 items-end overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Amount</span>
            <span className="font-bold text-gray-900 truncate w-full text-right">
              {formatConverted(convertedAmount, targetCurrency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
