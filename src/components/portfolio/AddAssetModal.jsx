import { useState } from 'react';
import { X, Search, Coins } from 'lucide-react';
import { currency } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';

export default function AddAssetModal({ isOpen, onClose, form, handleFormChange, handleAddHolding, loading }) {
  const { currencyCode } = useCurrency();
  
  if (!isOpen) return null;

  const amount = Number(form.amount) || 0;
  const buyPrice = Number(form.averageBuyPrice) || 0;
  const totalCost = amount * buyPrice;

  const onSubmit = (e) => {
    handleAddHolding(e);
    // Modal closes itself externally when loading stops if successful, 
    // or can be managed in the wrapper. We leave the close to the wrapper.
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-500 rounded-lg">
              <Coins size={18} />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Add Transaction</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 relative">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Search Asset</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 size-4" />
                <input
                  value={form.coinId}
                  onChange={(e) => handleFormChange('coinId', e.target.value)}
                  placeholder="Coin API ID (e.g., bitcoin)"
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
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
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
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
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
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
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Purchase Date (Required)</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => handleFormChange('purchaseDate', e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Exchange (Optional)</label>
              <input
                value={form.exchange || ''}
                onChange={(e) => handleFormChange('exchange', e.target.value)}
                placeholder="e.g. Binance"
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Currency</label>
              <select
                value={form.currency || 'USD'}
                onChange={(e) => handleFormChange('currency', e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm appearance-none"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Notes / Tags (Optional)</label>
              <input
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="e.g. Long term hold"
                className="w-full bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
              />
            </div>
          </div>

          <div className="mt-2 bg-sky-50/50 p-4 rounded-xl border border-sky-100 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">Total Investment</span>
            <span className="text-xl font-black text-sky-700">{currency(totalCost, false, currencyCode)}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-black uppercase tracking-wider py-3.5 rounded-xl transition shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 bg-gray-900 hover:bg-black text-white text-sm font-black uppercase tracking-wider py-3.5 rounded-xl transition shadow-sm disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Save Asset'}
            </button>
          </div>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
