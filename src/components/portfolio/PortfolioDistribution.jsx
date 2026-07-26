import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { currency } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PieChart as PieChartIcon, LayoutDashboard, Plus } from 'lucide-react';

const COIN_COLORS = {
  'BTC': '#F7931A',
  'BITCOIN': '#F7931A',
  'ETH': '#627EEA',
  'ETHEREUM': '#627EEA',
  'BNB': '#F3BA2F',
  'SOL': '#14F195',
  'SOLANA': '#14F195',
  'USDT': '#26A17B',
  'TETHER': '#26A17B',
  'DOGE': '#C2A633'
};

const DEFAULT_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const OTHERS_COLOR = '#9CA3AF';

const CustomTooltip = ({ active, payload }) => {
  const { currencyCode } = useCurrency();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl z-50 min-w-[200px]">
        <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
          <p className="text-white font-black text-sm">{data.name}</p>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Allocation</span>
            <span className="text-[10px] font-black text-white">{data.percent}%</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Amount Held</span>
            <span className="text-[10px] font-black text-white">{data.amount} {data.symbol}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase">Current Value</span>
            <span className="text-sm font-black text-white">{currency(data.value, false, currencyCode)}</span>
          </div>
          {data.currentPrice && (
            <div className="flex justify-between items-center gap-4 border-t border-gray-800 pt-1 mt-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Price</span>
              <span className="text-[10px] font-black text-gray-300">{currency(data.currentPrice, false, currencyCode)}</span>
            </div>
          )}
          {data.pl !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Profit/Loss</span>
              <span className={`text-[10px] font-black ${data.pl >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {data.pl >= 0 ? '+' : ''}{currency(data.pl, false, currencyCode)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function PortfolioDistribution({ holdingsWithPrice, totalValue }) {
  const { currencyCode } = useCurrency();

  const chartData = useMemo(() => {
    let sorted = holdingsWithPrice
      .filter(h => (Number(h.currentPrice) * Number(h.amount)) > 0)
      .map(h => {
        const val = Number(h.currentPrice) * Number(h.amount);
        const cost = Number(h.averageBuyPrice) * Number(h.amount);
        return {
          name: h.symbol || h.coinId,
          symbol: h.symbol,
          originalName: h.symbol || h.coinId,
          value: val,
          currentPrice: Number(h.currentPrice),
          amount: Number(h.amount),
          pl: val - cost,
          percent: Number((val / totalValue * 100).toFixed(2)),
          image: h.image
        };
      })
      .sort((a, b) => b.value - a.value);

    if (sorted.length > 5) {
      const top5 = sorted.slice(0, 5);
      const others = sorted.slice(5);
      
      const othersValue = others.reduce((sum, item) => sum + item.value, 0);
      const othersPL = others.reduce((sum, item) => sum + item.pl, 0);
      const othersPercent = Number((othersValue / totalValue * 100).toFixed(2));
      
      top5.push({
        name: 'Others',
        isOthers: true,
        value: othersValue,
        pl: othersPL,
        percent: othersPercent,
        amount: 0,
        symbol: ''
      });
      sorted = top5;
    }

    let colorIndex = 0;
    return sorted.map(item => {
      let fill = OTHERS_COLOR;
      if (!item.isOthers) {
        const key = item.originalName?.toUpperCase();
        if (COIN_COLORS[key]) {
          fill = COIN_COLORS[key];
        } else {
          fill = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length];
          colorIndex++;
        }
      }
      return { ...item, fill };
    });
  }, [holdingsWithPrice, totalValue]);

  if (holdingsWithPrice.length === 0 || chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-sky-100 blur-3xl rounded-full opacity-50 pointer-events-none" />
          <div className="size-24 rounded-full bg-gradient-to-tr from-sky-50 to-white flex items-center justify-center border-2 border-white shadow-xl relative z-10">
            <LayoutDashboard className="text-sky-500 size-10" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">
          {holdingsWithPrice.length === 0 ? "No Portfolio Data" : "Waiting for Market Data"}
        </h3>
        <p className="text-sm font-bold text-gray-500 text-center max-w-sm mb-8">
          {holdingsWithPrice.length === 0 
            ? "Your portfolio is currently empty. Add your first asset to visualize your asset distribution."
            : "We are syncing live market prices. Please wait a moment or check your connection."}
        </p>
        {holdingsWithPrice.length === 0 && (
          <button 
            onClick={() => document.querySelector('button[title="Add Asset"]')?.click()}
            className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider shadow-xl shadow-gray-900/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Plus size={18} /> Add Your First Asset
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-4 mb-6">
        <PieChartIcon className="text-purple-500 size-5" />
        <h2 className="text-lg font-black tracking-tight text-gray-900">Asset Distribution</h2>
      </div>
      
      <div className="flex flex-col xl:flex-row items-center justify-center gap-8 lg:gap-12 flex-1">
        
        {/* Doughnut Chart */}
        <div className="h-64 w-64 relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={115}
                paddingAngle={4}
                stroke="none"
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                cornerRadius={6}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity outline-none cursor-pointer" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Portfolio</span>
            <span className="text-xl font-black text-gray-900">
              {currency(totalValue, true, currencyCode)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {chartData.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute -inset-1 rounded-full opacity-20 blur-[2px]" style={{ backgroundColor: item.fill }} />
                  <div className="size-3 rounded-full relative z-10" style={{ backgroundColor: item.fill }} />
                </div>
                {item.image && !item.isOthers ? (
                  <img src={item.image} alt="" className="size-6 rounded-full border border-gray-200 shadow-sm bg-white" />
                ) : (
                  <div className="size-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[8px] font-black text-gray-500">
                    {item.name[0]}
                  </div>
                )}
                <span className="font-black text-gray-900 text-sm">{item.name}</span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="font-black text-gray-900 text-sm leading-tight">{item.percent}%</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{currency(item.value, false, currencyCode)}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
