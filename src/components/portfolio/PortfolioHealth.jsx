import { Brain, Activity, ShieldAlert, Target } from 'lucide-react';

export default function PortfolioHealth({ healthMetrics, analysis }) {
  // healthScore, riskScore, riskLevel, diversificationScore
  
  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm h-full flex flex-col relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl pointer-events-none rounded-full" />
      
      <div className="flex items-center gap-2 border-b border-gray-50 pb-4 mb-5">
        <Brain className="text-purple-500 size-5" />
        <h2 className="text-lg font-black text-gray-900 tracking-tight">AI Portfolio Health</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <HealthScoreCard label="Health Score" value={healthMetrics.healthScore} color="text-teal-500" />
        <HealthScoreCard label="Risk Score" value={healthMetrics.riskScore} color="text-sky-500" />
      </div>

      <div className="flex flex-col gap-5 relative z-10">
        <ProgressRow label="Diversification" value={healthMetrics.diversificationScore} />
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Risk Exposure</span>
            <span className="text-gray-900">{healthMetrics.riskLevel} Risk</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full transition-all duration-1000"
              style={{ width: `${healthMetrics.riskScore}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6 relative z-10">
        <div className="text-xs leading-relaxed text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <Target size={14} className="text-purple-500" />
            <span className="font-bold text-gray-900 uppercase tracking-wider text-[10px]">AI Assessment</span>
          </div>
          {analysis ? (
            analysis.error ? (
              <p className="text-rose-500 font-bold">{analysis.error}</p>
            ) : (
              <p className="whitespace-pre-wrap">{analysis.strengths?.[0] || analysis.summary || analysis.raw || 'AI health summary available.'}</p>
            )
          ) : (
            <p className="text-gray-500 italic font-medium">Run the AI Portfolio Advisor above to generate a comprehensive risk and diversification assessment of your holdings.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthScoreCard({ label, value, color }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}<span className="text-sm font-bold text-gray-400 ml-0.5">/100</span></p>
    </div>
  );
}

function ProgressRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-32">{label}</span>
      <div className="flex-1 mx-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-teal-400 rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-black text-gray-900 w-12 text-right">{value}/100</span>
    </div>
  );
}
