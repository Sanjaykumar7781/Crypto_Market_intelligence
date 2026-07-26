import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Line, ReferenceDot } from 'recharts';
import { LineChart, Calendar, Target, Activity, Plus } from 'lucide-react';
import { currency, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';
import { api } from '../../services/api.js';

const CustomTooltip = ({ active, payload, label }) => {
  const { currencyCode } = useCurrency();
  if (active && payload && payload.length) {
    const getVal = (key) => payload.find(p => p.dataKey === key)?.value;
    const pValue = getVal('portfolio') || 0;
    const pCost = getVal('investment') || 0;
    const pProfit = getVal('profit') || 0;
    const pBtc = getVal('btc');
    const pEth = getVal('eth');

    const roi = pCost ? (pProfit / pCost) * 100 : 0;

    return (
      <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl z-50 min-w-[220px]">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-700 pb-2">
          <Calendar size={14} className="text-gray-400" />
          <p className="text-white font-bold text-xs">{label}</p>
        </div>
        
        <div className="flex flex-col gap-2">
          {pValue !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> Portfolio Value
              </span>
              <span className="text-sm font-black text-white">{currency(pValue, false, currencyCode)}</span>
            </div>
          )}
          
          {pCost !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span> Investment
              </span>
              <span className="text-xs font-bold text-gray-300">{currency(pCost, false, currencyCode)}</span>
            </div>
          )}
          
          {pProfit !== undefined && (
            <div className="flex justify-between items-center gap-4 border-t border-gray-700 pt-1 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${pProfit >= 0 ? 'bg-teal-500' : 'bg-rose-500'}`}></span> Profit/Loss
              </span>
              <div className="flex flex-col items-end leading-tight">
                <span className={`text-xs font-black ${pProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {pProfit >= 0 ? '+' : ''}{currency(pProfit, false, currencyCode)}
                </span>
                <span className={`text-[10px] font-bold ${pProfit >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                  {pProfit >= 0 ? '+' : ''}{roi.toFixed(2)}% ROI
                </span>
              </div>
            </div>
          )}

          {pBtc !== undefined && (
            <div className="flex justify-between items-center gap-4 border-t border-gray-700 pt-1 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> BTC Value
              </span>
              <span className="text-xs font-black text-white">{currency(pBtc, false, currencyCode)}</span>
            </div>
          )}

          {pEth !== undefined && (
            <div className="flex justify-between items-center gap-4 border-t border-gray-700 pt-1 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> ETH Value
              </span>
              <span className="text-xs font-black text-white">{currency(pEth, false, currencyCode)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function PortfolioPerformance({ totalValue, totalCost, holdingsWithPrice = [] }) {
  const { currencyCode } = useCurrency();
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [buyMarkers, setBuyMarkers] = useState([]);
  
  const [toggles, setToggles] = useState({
    portfolio: true,
    investment: true,
    profit: false,
    btc: false,
    eth: false
  });

  const toggleLine = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    let isMounted = true;

    const buildTimeline = async () => {
      if (holdingsWithPrice.length === 0) {
        if (isMounted) setChartData([]);
        return;
      }

      setLoading(true);

      const now = Date.now();
      let earliestPurchase = now;
      const markers = [];

      holdingsWithPrice.forEach(h => {
        const pd = h.purchaseDate ? new Date(h.purchaseDate).getTime() : now;
        if (pd < earliestPurchase) earliestPurchase = pd;
        
        // Add to markers if valid
        if (pd <= now) {
          markers.push({
            dateStr: new Date(pd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            timestamp: pd,
            amount: h.amount,
            symbol: h.symbol,
            buyPrice: h.averageBuyPrice,
          });
        }
      });

      const dayMs = 24 * 3600 * 1000;
      let startTime = earliestPurchase;
      let queryRange = 'MAX';

      if (filter === '1D') { startTime = now - dayMs; queryRange = '24H'; }
      else if (filter === '7D') { startTime = now - 7 * dayMs; queryRange = '7D'; }
      else if (filter === '30D') { startTime = now - 30 * dayMs; queryRange = '30D'; }
      else if (filter === '90D') { startTime = now - 90 * dayMs; queryRange = '90D'; }
      else if (filter === '180D') { startTime = now - 180 * dayMs; queryRange = '180D'; }
      else if (filter === '1Y') { startTime = now - 365 * dayMs; queryRange = '365D'; }

      // 1. Fan-out API calls for all assets
      const promises = holdingsWithPrice.map(async (holding) => {
        try {
          const history = await api.chart(holding.coinId, queryRange, currencyCode);
          return { holding, history: Array.isArray(history) ? history : [] };
        } catch (error) {
          return { holding, history: [] };
        }
      });

      const results = await Promise.allSettled(promises);
      if (!isMounted) return;

      const validResults = results.filter(r => r.status === 'fulfilled').map(r => r.value);

      // Find master spine
      let masterSpine = [];
      for (const res of validResults) {
        if (res.history.length > masterSpine.length) masterSpine = res.history;
      }

      if (masterSpine.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      let filteredSpine = masterSpine.filter(point => new Date(point.time).getTime() >= startTime);

      if (filteredSpine.length === 0) {
        // Fallback: Generate simulated spine using linear interpolation intervals
        const simulatedSpine = [];
        let curr = startTime;
        while(curr <= now) {
          simulatedSpine.push({ time: curr });
          curr += dayMs;
        }
        if (simulatedSpine.length === 0) simulatedSpine.push({ time: now });
        filteredSpine = simulatedSpine;
      }

      // Calculate Timeline
      const mergedData = filteredSpine.map((spinePoint) => {
        const spineTime = new Date(spinePoint.time).getTime();
        
        let portfolioVal = 0;
        let btcVal = 0;
        let ethVal = 0;
        let currentInvestment = 0;

        validResults.forEach(({ holding, history }) => {
          const pd = holding.purchaseDate ? new Date(holding.purchaseDate).getTime() : now;
          
          // Only include this asset if it was purchased on or before this spine time
          if (pd <= spineTime) {
            let matchedPrice = Number(holding.currentPrice) || 0;
            const buyPrice = Number(holding.averageBuyPrice) || matchedPrice;

            if (history.length > 0) {
              const closest = history.reduce((prev, curr) => {
                const currTime = new Date(curr.time).getTime();
                const prevTime = new Date(prev.time).getTime();
                return (Math.abs(currTime - spineTime) < Math.abs(prevTime - spineTime) ? curr : prev);
              });
              const tolerance = filter === '1D' ? 3600000 * 2 : 3600000 * 48; 
              if (Math.abs(new Date(closest.time).getTime() - spineTime) <= tolerance) {
                matchedPrice = closest.price;
              }
            } else {
              // Simulated Linear Interpolation
              const totalDuration = now - pd;
              if (totalDuration > 0 && spineTime >= pd) {
                const ratio = (spineTime - pd) / totalDuration;
                matchedPrice = buyPrice + (matchedPrice - buyPrice) * ratio;
              } else {
                matchedPrice = buyPrice;
              }
            }

            const assetVal = matchedPrice * Number(holding.amount);
            portfolioVal += assetVal;
            currentInvestment += buyPrice * Number(holding.amount);

            if (holding.symbol.toUpperCase() === 'BTC') btcVal += assetVal;
            if (holding.symbol.toUpperCase() === 'ETH') ethVal += assetVal;
          }
        });

        const dateObj = new Date(spinePoint.time);
        const dateStr = filter === '1D' 
          ? dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) 
          : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        return {
          date: dateStr,
          timestamp: spineTime,
          portfolio: portfolioVal,
          investment: currentInvestment,
          profit: portfolioVal - currentInvestment,
          btc: btcVal,
          eth: ethVal
        };
      });

      mergedData.sort((a, b) => a.timestamp - b.timestamp);
      setChartData(mergedData);
      
      // Filter buy markers to those that fall within the current view
      const visibleMarkers = markers.filter(m => m.timestamp >= startTime).map(m => {
        if (mergedData.length === 0) return null;
        const closestPoint = mergedData.reduce((prev, curr) => {
          return Math.abs(curr.timestamp - m.timestamp) < Math.abs(prev.timestamp - m.timestamp) ? curr : prev;
        });
        return { ...m, y: closestPoint.portfolio, date: closestPoint.date };
      }).filter(Boolean);
      
      setBuyMarkers(visibleMarkers);
      setLoading(false);
    };

    buildTimeline();
    return () => { isMounted = false; };
  }, [filter, holdingsWithPrice, currencyCode, totalCost]);


  if (holdingsWithPrice.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 border border-gray-200 shadow-sm flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-teal-100 blur-3xl rounded-full opacity-50 pointer-events-none" />
          <div className="size-24 rounded-full bg-gradient-to-tr from-teal-50 to-white flex items-center justify-center border-2 border-white shadow-xl relative z-10">
            <Activity className="text-teal-500 size-10" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">No Performance History</h3>
        <p className="text-sm font-bold text-gray-500 text-center max-w-sm mb-8">
          Add assets to your portfolio to unlock institutional-grade historical timelines, profit tracking, and deep ROI analytics.
        </p>
        <button 
          onClick={() => document.querySelector('button[title="Add Asset"]')?.click()}
          className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider shadow-xl shadow-gray-900/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Plus size={18} /> Add Your First Asset
        </button>
      </div>
    );
  }

  // Calculate advanced metrics based ONLY on chartData to reflect the selected time window accurately
  let highest = 0;
  let lowest = Infinity;
  let sumVal = 0;
  let bestDayObj = null;
  let worstDayObj = null;
  
  if (chartData.length > 0) {
    highest = Math.max(...chartData.map(d => d.portfolio));
    lowest = Math.min(...chartData.map(d => d.portfolio));
    sumVal = chartData.reduce((acc, d) => acc + d.portfolio, 0);
    
    // Find best/worst days within the window
    let maxChange = -Infinity;
    let minChange = Infinity;

    for(let i = 1; i < chartData.length; i++) {
      const prev = chartData[i-1].portfolio;
      const curr = chartData[i].portfolio;
      const change = prev ? ((curr - prev) / prev) * 100 : 0;
      
      if (change > maxChange) { maxChange = change; bestDayObj = chartData[i]; }
      if (change < minChange) { minChange = change; worstDayObj = chartData[i]; }
    }
  } else {
    highest = totalValue;
    lowest = totalValue;
  }
  
  const average = chartData.length > 0 ? sumVal / chartData.length : totalValue;
  
  // Get start vs end of the timeframe for accurate change calculation
  const periodStart = chartData.length > 0 ? chartData[0].portfolio : 0;
  const periodEnd = chartData.length > 0 ? chartData[chartData.length - 1].portfolio : 0;
  const periodChange = periodEnd - periodStart;
  const periodChangePct = periodStart ? (periodChange / periodStart) * 100 : 0;

  // Custom marker tooltip
  const renderCustomMarker = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#10B981" stroke="#fff" strokeWidth={2} className="drop-shadow-md" />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#10B981" fontSize={10} fontWeight="bold">Buy</text>
      </g>
    );
  };

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm flex flex-col h-full group hover:shadow-md transition">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
        <div className="flex items-center gap-2">
          <LineChart className="text-sky-500 size-5" />
          <h2 className="text-lg font-black tracking-tight text-gray-900">Historical Performance</h2>
        </div>
        
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          {['1D', '7D', '30D', '90D', '180D', '1Y', 'ALL'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              disabled={loading}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${filter === f ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 disabled:opacity-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 px-2">
        <ToggleBtn label="Portfolio Value" active={toggles.portfolio} color="bg-sky-500" onClick={() => toggleLine('portfolio')} />
        <ToggleBtn label="Investment" active={toggles.investment} color="bg-gray-400" onClick={() => toggleLine('investment')} />
        <ToggleBtn label="Profit/Loss" active={toggles.profit} color="bg-teal-500" onClick={() => toggleLine('profit')} />
        {holdingsWithPrice.some(h => h.symbol.toUpperCase() === 'BTC') && (
          <ToggleBtn label="BTC Value" active={toggles.btc} color="bg-orange-500" onClick={() => toggleLine('btc')} />
        )}
        {holdingsWithPrice.some(h => h.symbol.toUpperCase() === 'ETH') && (
          <ToggleBtn label="ETH Value" active={toggles.eth} color="bg-blue-500" onClick={() => toggleLine('eth')} />
        )}
      </div>

      <div className="h-72 w-full relative mb-6">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] z-10 rounded-xl">
            <div className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-wider">
              <Activity className="animate-spin size-4" /> Generating Timeline...
            </div>
          </div>
        ) : null}

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF" 
              tick={{ fontSize: 10, fontWeight: 700 }} 
              tickLine={false} 
              axisLine={false} 
              minTickGap={30}
            />
            <YAxis 
              stroke="#9CA3AF" 
              tick={{ fontSize: 10, fontWeight: 700 }} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => currency(val, true, currencyCode)}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }} />
            
            {toggles.portfolio && (
              <Area type="monotone" dataKey="portfolio" stroke="#0EA5E9" strokeWidth={3} fillOpacity={1} fill="url(#colorPortfolio)" isAnimationActive={false} />
            )}
            {toggles.investment && (
              <Line type="monotone" dataKey="investment" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
            )}
            {toggles.profit && (
              <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" isAnimationActive={false} />
            )}
            {toggles.btc && (
              <Line type="monotone" dataKey="btc" stroke="#F97316" strokeWidth={2} dot={false} isAnimationActive={false} />
            )}
            {toggles.eth && (
              <Line type="monotone" dataKey="eth" stroke="#3B82F6" strokeWidth={2} dot={false} isAnimationActive={false} />
            )}
            
            {/* Buy Markers */}
            {buyMarkers.map((marker, i) => (
              <ReferenceDot 
                key={i} 
                x={marker.date} 
                y={marker.y} 
                r={6} 
                fill="#10B981" 
                stroke="#fff" 
                strokeWidth={2} 
                shape={renderCustomMarker}
                isFront={true}
              />
            ))}

          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Summary Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-gray-100 mt-auto">
        <MiniStat label="Highest Value" value={currency(highest, false, currencyCode)} />
        <MiniStat label="Lowest Value" value={lowest === Infinity ? currency(0, false, currencyCode) : currency(lowest, false, currencyCode)} />
        <MiniStat label="Average Value" value={currency(average, false, currencyCode)} />
        <MiniStat 
          label={`${filter} Return`} 
          value={`${periodChange >= 0 ? '+' : ''}${currency(periodChange, false, currencyCode)}`} 
          sub={`${periodChangePct >= 0 ? '+' : ''}${periodChangePct.toFixed(2)}%`}
          valueColor={periodChange >= 0 ? 'text-teal-500' : 'text-rose-500'}
        />
        <MiniStat label="Best Day" value={bestDayObj?.date || 'N/A'} sub="Historical peak" />
      </div>

    </div>
  );
}

function ToggleBtn({ label, active, color, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${active ? 'bg-gray-900 border-gray-900 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
    >
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      {label}
    </button>
  );
}

function MiniStat({ label, value, sub, valueColor = 'text-gray-900' }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col justify-center">
      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</span>
      <div className="flex flex-col xl:flex-row xl:items-center gap-1">
        <span className={`text-sm font-black truncate ${valueColor}`}>{value}</span>
        {sub && <span className={`text-[9px] font-bold px-1 rounded border inline-block w-fit ${sub.startsWith('+') ? 'text-teal-600 border-teal-100 bg-teal-50' : sub.startsWith('-') ? 'text-rose-600 border-rose-100 bg-rose-50' : 'text-gray-500 border-gray-200 bg-white'}`}>{sub}</span>}
      </div>
    </div>
  );
}
