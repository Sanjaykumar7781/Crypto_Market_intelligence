import { Plus, Search, Tag, Wallet, CreditCard, HelpCircle } from 'lucide-react';
import { currency } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';

export default function AddAssetForm({ form, handleFormChange, handleAddHolding, loading }) {
  const { currencyCode } = useCurrency();
  
  const amount = Number(form.amount) || 0;
  const buyPrice = Number(form.averageBuyPrice) || 0;
  const totalCost = amount * buyPrice;

  return (
    <div className="glass-premium rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-50 text-sky-500 rounded-lg">
            <Plus size={16} />
          </div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Add New Transaction</h2>
        </div>
      </div>
      
      <form className="flex flex-col gap-5 h-full" onSubmit={handleAddHolding}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 relative">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Search Asset</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 size-4" />
              <input
                value={form.coinId}
                onChange={(e) => {
                  handleFormChange('coinId', e.target.value);
                  // Auto-fill symbol if possible or prompt user
                }}
                placeholder="Coin API ID (e.g., bitcoin)"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Symbol</label>
            <input
              value={form.symbol}
              onChange={(e) => handleFormChange('symbol', e.target.value)}
              placeholder="e.g. BTC"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Quantity</label>
            <input
              value={form.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              placeholder="0.00"
              type="number"
              min="0"
              step="any"
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              required
            />
          </div>
          
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Average Buy Price</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-black">$</span>
              <input
                value={form.averageBuyPrice}
                onChange={(e) => handleFormChange('averageBuyPrice', e.target.value)}
                placeholder="0.00"
                type="number"
                min="0"
                step="any"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="mt-2 bg-sky-50/50 p-4 rounded-xl border border-sky-100 flex items-center justify-between">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Total Cost Basis</span>
          <span className="text-lg font-black text-sky-700">{currency(totalCost, false, currencyCode)}</span>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <button 
            type="submit" 
            className="w-full bg-gray-900 hover:bg-black text-white text-sm font-black uppercase tracking-wider py-3.5 rounded-xl transition shadow-sm disabled:opacity-50" 
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
