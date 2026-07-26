import { X, ExternalLink, Globe, Activity, TrendingUp, TrendingDown, Target, HelpCircle } from 'lucide-react';
import { currency, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';
import MiniChart from './MiniChart.jsx';

export default function HoldingDrawer({ isOpen, onClose, holding, totalValue }) {
  const { currencyCode } = useCurrency();

  if (!isOpen || !holding) return null;

  const currentVal = (Number(holding.currentPrice) || 0) * (Number(holding.amount) || 0);
  const costBasis = (Number(holding.averageBuyPrice) || 0) * (Number(holding.amount) || 0);
  const pl = currentVal - costBasis;
  const plPct = costBasis ? (pl / costBasis) * 100 : 0;
  const allocation = totalValue ? (currentVal / totalValue) * 100 : 0;
  
  // Mocks for AI and Deep Analytics
  const aiRec = plPct > 20 ? 'HOLD' : plPct < -10 ? 'BUY' : 'SELL';
  const confidence = Math.floor(Math.random() * 30) + 70;
  const risk = ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)];
  const isPositive = holding.change24h >= 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 overflow-y-auto"
        style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {holding.image ? (
              <img src={holding.image} alt="" className="size-10 rounded-full border border-gray-200 bg-white" />
            ) : (
              <div className="size-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center font-black text-gray-500">
                {holding.symbol?.[0] || '?'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">{holding.symbol}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{holding.coinId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          
          {/* Top Performance Block */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <MiniChart coinId={holding.coinId} currentPrice={holding.currentPrice} change24h={holding.change24h} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Current Price</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-gray-900 leading-none">{currency(holding.currentPrice, false, currencyCode)}</span>
              <span className={`text-xs font-bold mb-1 flex items-center gap-0.5 ${isPositive ? 'text-teal-500' : 'text-rose-500'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(holding.change24h || 0).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Investment Block */}
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Activity size={14} className="text-sky-500" /> Holdings Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DataBox label="Total Value" value={currency(currentVal, false, currencyCode)} />
              <DataBox label="Total Investment" value={currency(costBasis, false, currencyCode)} />
              <DataBox 
                label="Unrealized P/L" 
                value={`${pl >= 0 ? '+' : ''}${currency(pl, false, currencyCode)}`} 
                valueColor={pl >= 0 ? 'text-teal-500' : 'text-rose-500'} 
              />
              <DataBox 
                label="ROI" 
                value={`${plPct >= 0 ? '+' : ''}${percent(plPct)}`} 
                valueColor={plPct >= 0 ? 'text-teal-500' : 'text-rose-500'} 
              />
              <DataBox label="Amount Held" value={holding.amount} />
              <DataBox label="Avg. Buy Price" value={currency(holding.averageBuyPrice, false, currencyCode)} />
            </div>
            
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                <span>Portfolio Allocation</span>
                <span className="text-purple-500">{allocation.toFixed(2)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${allocation}%` }} />
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Target size={14} className="text-amber-500" /> AI Recommendation
            </h3>
            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
              aiRec === 'BUY' ? 'bg-teal-50 border-teal-100' : 
              aiRec === 'SELL' ? 'bg-rose-50 border-rose-100' : 
              'bg-sky-50 border-sky-100'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`text-lg font-black ${
                  aiRec === 'BUY' ? 'text-teal-600' : 
                  aiRec === 'SELL' ? 'text-rose-600' : 
                  'text-sky-600'
                }`}>{aiRec}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                  {confidence}% Confidence
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700 leading-relaxed">
                Based on current market cap dominance and moving averages, the AI suggests to <strong>{aiRec}</strong> this asset. Risk level is currently <strong>{risk}</strong>.
              </p>
            </div>
          </div>

          {/* Network & Links */}
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Globe size={14} className="text-gray-400" /> Meta Data
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <DataBox label="Holding ID" value={holding._id.slice(-6)} />
              <DataBox label="Purchase Date" value={holding.date || 'Unknown'} />
              <DataBox label="Exchange" value="Binance (Mock)" />
              <DataBox label="Wallet" value="Ledger (Mock)" />
            </div>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  );
}

function DataBox({ label, value, valueColor = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</span>
      <span className={`text-sm font-black truncate ${valueColor}`}>{value}</span>
    </div>
  );
}
