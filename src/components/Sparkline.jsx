import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export default function Sparkline({ data = [], positive = true, width = 128, height = 40 }) {
  // Defensive: handle array, string (space-separated), or undefined
  let arr = [];
  if (Array.isArray(data)) {
    arr = data;
  } else if (typeof data === 'string' && data.trim()) {
    // Parse space-separated string of numbers (fallback for stringified sparkline)
    arr = data
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(n => !Number.isNaN(n));
  }

  const points = arr.map((v, i) => ({ index: i, value: Number(v) || 0 }));

  if (!points.length) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center text-[10px] text-slate-500">No Chart</div>
    );
  }

  const strokeColor = positive ? '#2ff4a6' : '#ff4d8d';
  const gradId = `sparklineGrad-${positive ? 'pos' : 'neg'}-${Math.floor(Math.random() * 1000)}`;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width={width} height={height}>
        <AreaChart data={points} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            fill={`url(#${gradId})`}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
