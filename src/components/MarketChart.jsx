import { useEffect, useRef, useState } from 'react';
import { Area, AreaChart, Tooltip, XAxis, YAxis, Bar, ComposedChart } from 'recharts';
import { currency, number } from '../utils/format.js';

export default function MarketChart({ data = [], mode = 'price', currencyCode = 'USD' }) {
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) {
        setChartWidth(containerRef.current.clientWidth);
      }
    }

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Ensure data is an array with at least some default structure
  let chartData = Array.isArray(data) ? data : [];
  
  // Provide fallback if no data
  if (chartData.length === 0) {
    chartData = mode === 'volume' 
      ? [
          { time: 'Asset 1', volume: 10000000 },
          { time: 'Asset 2', volume: 8000000 },
          { time: 'Asset 3', volume: 6000000 },
          { time: 'Asset 4', volume: 5000000 },
        ]
      : [
          { time: '1', price: 1000, volume: 1000000 },
          { time: '2', price: 1050, volume: 1100000 },
          { time: '3', price: 1100, volume: 1200000 },
        ];
  }

  return (
    <div ref={containerRef} className="w-full min-w-0" style={{ height: 280 }}>
      {chartWidth > 0 && mode === 'volume' ? (
        <ComposedChart width={chartWidth} height={280} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <XAxis dataKey="time" stroke="#71717a" tick={{ fontSize: 12 }} />
          <YAxis stroke="#71717a" tickFormatter={number} tick={{ fontSize: 12 }} width={60} />
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b' }} formatter={(value) => number(value)} />
          <Bar dataKey="volume" fill="#14b8a6" radius={[6, 6, 0, 0]} />
        </ComposedChart>
      ) : chartWidth > 0 ? (
        <AreaChart width={chartWidth} height={280} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#fb7185" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#71717a" tick={{ fontSize: 12 }} />
          <YAxis stroke="#71717a" tickFormatter={(value) => currency(value, true, currencyCode)} tick={{ fontSize: 12 }} width={60} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: 8, color: '#18181b' }} formatter={(value) => currency(value, false, currencyCode)} />
          <Area type="monotone" dataKey="price" stroke="#fb7185" strokeWidth={3} fill="url(#priceGradient)" />
        </AreaChart>
      ) : null}
    </div>
  );
}
