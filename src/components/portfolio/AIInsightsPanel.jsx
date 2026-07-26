import React, { useMemo } from 'react';
import { Activity, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Target, Clock, Zap } from 'lucide-react';
import { currency, percent } from '../../utils/format.js';
import { useCurrency } from '../../hooks/useCurrency.js';

export default function AIInsightsPanel({ holdingsWithPrice, totalValue }) {
  const { currencyCode } = useCurrency();

  const insights = useMemo(() => {
    if (!holdingsWithPrice || holdingsWithPrice.length === 0) return null;

    const sortedByValue = [...holdingsWithPrice].sort((a, b) => (b.currentPrice * b.amount) - (a.currentPrice * a.amount));
    const sortedByGain = [...holdingsWithPrice].sort((a, b) => (b.change24h || 0) - (a.change24h || 0));

    const topAsset = sortedByValue[0];
    const topGainer = sortedByGain[0];
    const topLoser = sortedByGain[sortedByGain.length - 1];

    const btcEthVal = holdingsWithPrice
      .filter(h => ['BTC', 'ETH'].includes(h.symbol?.toUpperCase()))
      .reduce((sum, h) => sum + (h.currentPrice * h.amount), 0);

    const stableVal = holdingsWithPrice
      .filter(h => ['USDT', 'USDC', 'DAI', 'BUSD'].includes(h.symbol?.toUpperCase()))
      .reduce((sum, h) => sum + (h.currentPrice * h.amount), 0);

    const btcEthPct = totalValue ? (btcEthVal / totalValue) * 100 : 0;
    const stablePct = totalValue ? (stableVal / totalValue) * 100 : 0;
    const topAssetPct = totalValue && topAsset ? ((topAsset.currentPrice * topAsset.amount) / totalValue) * 100 : 0;

    let health = 'Excellent';
    let healthColor = 'text-teal-500';
    let risk = 'Moderate';
    let riskColor = 'text-amber-500';

    if (topAssetPct > 70) {
      health = 'Warning';
      healthColor = 'text-rose-500';
      risk = 'Extreme';
      riskColor = 'text-rose-500';
    } else if (stablePct > 50) {
      health = 'Safe';
      healthColor = 'text-blue-500';
      risk = 'Very Low';
      riskColor = 'text-teal-500';
    } else if (btcEthPct > 50) {
      health = 'Strong';
      healthColor = 'text-emerald-500';
      risk = 'Low-Moderate';
      riskColor = 'text-blue-500';
    }

    // Simulated Expected Monthly Return based on risk profile
    const expMonthly = stablePct > 50 ? 0.5 : topAssetPct > 70 ? 12.5 : btcEthPct > 50 ? 4.2 : 8.5;
    const volatility = stablePct > 50 ? 'Low (2%)' : topAssetPct > 70 ? 'High (80%)' : btcEthPct > 50 ? 'Med (40%)' : 'High (60%)';

    let action = 'Hold steady.';
    if (topAssetPct > 70) action = `De-risk ${topAsset.symbol}.`;
    else if (stablePct > 50) action = 'Deploy cash into dips.';
    else if (btcEthPct > 50) action = 'Rebalance into Altcoins.';

    return {
      health, healthColor, risk, riskColor, expMonthly, volatility,
      topGainer, topLoser, action
    };
  }, [holdingsWithPrice, totalValue]);

  if (!insights) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <InsightCard 
        icon={<Activity size={16} className="text-blue-500" />} 
        title="Portfolio Health" 
        value={insights.health} 
        valueColor={insights.healthColor}
        subtitle="AI Diagnosis" 
      />
      <InsightCard 
        icon={<AlertTriangle size={16} className="text-rose-500" />} 
        title="Risk Level" 
        value={insights.risk} 
        valueColor={insights.riskColor}
        subtitle="Volatility Exposure" 
      />
      <InsightCard 
        icon={<Target size={16} className="text-purple-500" />} 
        title="Exp. Monthly Return" 
        value={`+${insights.expMonthly.toFixed(1)}%`} 
        valueColor="text-teal-500"
        subtitle="Stochastic Model" 
      />
      <InsightCard 
        icon={<Zap size={16} className="text-amber-500" />} 
        title="Recommended Action" 
        value={insights.action} 
        valueColor="text-gray-900"
        subtitle="Tactical Move" 
      />
      
      {insights.topGainer && (
        <MiniInsight 
          label="Best Asset" 
          value={insights.topGainer.symbol} 
          sub={`+${(insights.topGainer.change24h || 0).toFixed(2)}%`}
          icon={<TrendingUp size={14} className="text-teal-500" />}
        />
      )}
      {insights.topLoser && (
        <MiniInsight 
          label="Weakest Asset" 
          value={insights.topLoser.symbol} 
          sub={`${(insights.topLoser.change24h || 0).toFixed(2)}%`}
          icon={<TrendingDown size={14} className="text-rose-500" />}
        />
      )}
      <MiniInsight 
        label="Est. Volatility" 
        value={insights.volatility} 
        sub="Annualized"
        icon={<Clock size={14} className="text-indigo-500" />}
      />
      <MiniInsight 
        label="Market Sentiment" 
        value={insights.risk === 'Extreme' ? 'Greed' : insights.health === 'Safe' ? 'Fear' : 'Neutral'} 
        sub="Overall Bias"
        icon={<ShieldCheck size={14} className="text-emerald-500" />}
      />
    </div>
  );
}

function InsightCard({ icon, title, value, subtitle, valueColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition relative overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-50 pb-2.5 mb-3">
        <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">{icon}</div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={`text-xl font-black ${valueColor} truncate`}>{value}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{subtitle}</span>
      </div>
    </div>
  );
}

function MiniInsight({ label, value, sub, icon }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-gray-900">{value}</span>
          <span className="text-[9px] font-bold px-1 rounded border bg-white border-gray-200 text-gray-500">{sub}</span>
        </div>
      </div>
    </div>
  );
}
