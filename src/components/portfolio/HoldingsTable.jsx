import { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, Eye, Edit2, MoreVertical, Copy, ArrowRightLeft } from 'lucide-react';
import { currency, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';
import MiniChart from './MiniChart.jsx';

export default function HoldingsTable({ 
  holdingsWithPrice, 
  handleRemoveHolding, 
  loading, 
  totalValue,
  selectedRows,
  setSelectedRows,
  onRowClick
}) {
  const { currencyCode } = useCurrency();

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(holdingsWithPrice.map(h => h._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 overflow-x-auto bg-white rounded-xl">
      {loading ? (
        <div className="flex items-center justify-center h-64 text-xs font-bold text-gray-400">Loading portfolio assets...</div>
      ) : holdingsWithPrice.length > 0 ? (
        <table className="w-full text-sm whitespace-nowrap table-fixed min-w-[1400px]">
          <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-y border-gray-200">
            <tr>
              <th className="text-left py-4 pl-6 w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  checked={selectedRows.length === holdingsWithPrice.length && holdingsWithPrice.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="text-left py-4 px-2 w-48">Asset</th>
              <th className="text-right py-4 px-4 w-24">Price</th>
              <th className="text-right py-4 px-4 w-32">24H Chart</th>
              <th className="text-right py-4 px-4 w-28">Amount</th>
              <th className="text-right py-4 px-4 w-28">Avg Price</th>
              <th className="text-right py-4 px-4 w-32">Total Value</th>
              <th className="text-right py-4 px-4 w-32">Unrealized P/L</th>
              <th className="text-right py-4 px-4 w-32">Allocation</th>
              <th className="text-right py-4 pr-6 w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {holdingsWithPrice.map((holding) => {
              const currentVal = (Number(holding.currentPrice) || 0) * (Number(holding.amount) || 0);
              const costBasis = (Number(holding.averageBuyPrice) || 0) * (Number(holding.amount) || 0);
              const pl = currentVal - costBasis;
              const plPct = costBasis ? (pl / costBasis) * 100 : 0;
              const allocation = totalValue ? (currentVal / totalValue) * 100 : 0;
              const isPositive = holding.change24h >= 0;

              return (
                <tr 
                  key={holding._id} 
                  className={`hover:bg-gray-50 transition duration-200 group cursor-pointer ${selectedRows.includes(holding._id) ? 'bg-sky-50/50 hover:bg-sky-50' : ''}`}
                  onClick={() => onRowClick(holding)}
                >
                  <td className="py-4 pl-6" onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                      checked={selectedRows.includes(holding._id)}
                      onChange={() => handleSelectRow(holding._id)}
                    />
                  </td>
                  <td className="py-4 px-2 text-left">
                    <div className="flex items-center gap-3">
                      {holding.image ? (
                        <img src={holding.image} alt="" className="size-8 rounded-full border border-gray-200 shadow-sm bg-white" />
                      ) : (
                        <div className="size-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 shadow-sm">
                          {holding.symbol?.[0] || '?'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <p className="font-black text-gray-900 text-sm leading-tight">{holding.symbol}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{holding.coinId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-gray-900">{currency(Number(holding.currentPrice) || 0, false, currencyCode)}</span>
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-teal-500' : 'text-rose-500'}`}>
                        {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(holding.change24h || 0).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right flex flex-col items-end gap-1">
                    <MiniChart coinId={holding.coinId} currentPrice={holding.currentPrice} change24h={holding.change24h} />
                    <span className={`text-[9px] font-bold flex items-center gap-0.5 ${isPositive ? 'text-teal-500' : 'text-rose-500'}`}>
                      {isPositive ? '▲' : '▼'} {Math.abs(holding.change24h || 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-bold text-gray-900">{holding.amount}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-bold text-gray-600">{currency(Number(holding.averageBuyPrice) || 0, false, currencyCode)}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-black text-gray-900">{currency(currentVal, false, currencyCode)}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className={`font-black ${pl >= 0 ? 'text-teal-500' : 'text-rose-500'}`}>
                        {pl >= 0 ? '+' : ''}{currency(pl, false, currencyCode)}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded leading-none ${plPct >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                        {plPct >= 0 ? '+' : ''}{percent(plPct)} ROI
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-col gap-1.5 items-end w-full">
                      <span className="text-[10px] font-black text-gray-500">{allocation.toFixed(2)}%</span>
                      <div className="h-1.5 w-full max-w-[80px] bg-gray-100 rounded-full overflow-hidden self-end">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${allocation}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-6 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition" title="View details">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition" title="Edit holding">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition" 
                        title="Delete holding"
                        onClick={() => handleRemoveHolding(holding._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="size-16 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center mb-4">
            <ArrowRightLeft className="size-8 text-gray-300" />
          </div>
          <p className="text-sm font-black text-gray-900 mb-1">No Assets Added Yet</p>
          <p className="text-xs font-medium text-gray-500 max-w-xs">Your portfolio is currently empty. Click the button above to add your first transaction.</p>
        </div>
      )}
    </div>
  );
}
