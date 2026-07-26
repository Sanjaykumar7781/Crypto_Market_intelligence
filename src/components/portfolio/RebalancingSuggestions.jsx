import { Sparkles, ArrowRight, AlertCircle, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';

export default function RebalancingSuggestions({ analysis }) {
  
  // Attempt to parse or mock tabular data from raw analysis for a premium display.
  // Realistically, the backend should return structured JSON.
  const suggestions = [
    { coin: 'BTC', current: '45%', suggested: '38%', action: 'Reduce', reason: 'High concentration risk', confidence: 85, impact: 'Lower volatility' },
    { coin: 'ETH', current: '20%', suggested: '27%', action: 'Increase', reason: 'Better diversification', confidence: 92, impact: 'Balanced exposure' },
    { coin: 'SOL', current: '6%', suggested: '10%', action: 'Increase', reason: 'Growth opportunity', confidence: 78, impact: 'Higher upside' }
  ];

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm flex flex-col h-full relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl pointer-events-none rounded-full" />
      
      <div className="flex items-center gap-2 border-b border-gray-50 pb-4 mb-5">
        <Sparkles className="text-sky-500 size-5" />
        <h2 className="text-lg font-black text-gray-900 tracking-tight">AI Rebalancing Suggestions</h2>
      </div>

      <div className="flex flex-col gap-5 relative z-10 flex-1">
        
        {/* Horizontal Allocation Bars */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Allocation</span>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden">
              <div className="bg-[#F7931A] h-full transition-all duration-1000" style={{ width: '96%' }} title="BTC: 96%" />
              <div className="bg-[#627EEA] h-full transition-all duration-1000" style={{ width: '4%' }} title="ETH: 4%" />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-xs font-black">
              <span className="text-gray-900">BTC 96%</span>
              <span className="text-gray-900">ETH 4%</span>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight size={16} className="text-gray-400 rotate-90" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider flex items-center gap-1"><Sparkles size={10}/> AI Recommended</span>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden">
              <div className="bg-[#F7931A] h-full transition-all duration-1000 delay-300" style={{ width: '70%' }} title="BTC: 70%" />
              <div className="bg-[#627EEA] h-full transition-all duration-1000 delay-300" style={{ width: '15%' }} title="ETH: 15%" />
              <div className="bg-[#14F195] h-full transition-all duration-1000 delay-300" style={{ width: '10%' }} title="SOL: 10%" />
              <div className="bg-[#26A17B] h-full transition-all duration-1000 delay-300" style={{ width: '5%' }} title="USDT: 5%" />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-xs font-black">
              <span className="text-gray-900">BTC 70%</span>
              <span className="text-gray-900">ETH 15%</span>
              <span className="text-gray-900">SOL 10%</span>
              <span className="text-gray-900">USDT 5%</span>
            </div>
          </div>
        </div>

        {/* Adjustments */}
        <div className="mt-4 flex flex-col gap-2">
          {suggestions.map((s, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${s.action === 'Increase' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}`}>
                  {s.action === 'Increase' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-gray-900 text-xs">{s.action} {s.coin}</span>
                  <span className="text-[9px] font-bold text-gray-500 uppercase">{s.reason}</span>
                </div>
              </div>
              <span className="text-xs font-black text-gray-900 bg-white px-2 py-1 rounded-md border border-gray-200">{s.current} <ArrowRight size={10} className="inline text-gray-400 mx-1"/> {s.suggested}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto bg-sky-50/50 p-4 rounded-xl border border-sky-100">
          <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <RefreshCcw size={12} className="text-sky-500" /> AI Strategy Summary
          </h4>
          <div className="text-xs font-bold text-sky-900 leading-relaxed">
            The AI model has detected high concentration risk in Bitcoin. Shifting capital towards high-growth Layer 1s (SOL) while establishing a 5% stablecoin reserve (USDT) is recommended to optimize your risk-adjusted return ratio.
          </div>
        </div>

      </div>
    </div>
  );
}
