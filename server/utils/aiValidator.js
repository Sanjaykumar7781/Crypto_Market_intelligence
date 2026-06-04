export function sanitizeNumber(v, fallback = 0, min = -Infinity, max = Infinity) {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.max(min, Math.min(max, n));
  return fallback;
}

export function validateAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  out.healthScore = sanitizeNumber(obj.healthScore, null, 0, 100);
  out.riskScore = sanitizeNumber(obj.riskScore, null, 0, 100);
  out.diversificationScore = sanitizeNumber(obj.diversificationScore, null, 0, 100);
  out.strengths = Array.isArray(obj.strengths) ? obj.strengths.map(String) : [];
  out.weaknesses = Array.isArray(obj.weaknesses) ? obj.weaknesses.map(String) : [];
  out.rebalance = typeof obj.rebalance === 'string' ? obj.rebalance : obj.rebalance ? String(obj.rebalance) : null;
  out.recommendations = Array.isArray(obj.recommendations) ? obj.recommendations.map(String) : [];
  out.currentAllocation = Array.isArray(obj.currentAllocation)
    ? obj.currentAllocation.map((it) => ({ symbol: it.symbol || it.name || '', percent: sanitizeNumber(it.percent, 0, 0, 100), value: sanitizeNumber(it.value, 0) }))
    : [];
  out.recommendedAllocation = Array.isArray(obj.recommendedAllocation)
    ? obj.recommendedAllocation.map((it) => ({ symbol: it.symbol || it.name || '', percent: sanitizeNumber(it.percent, 0, 0, 100), value: sanitizeNumber(it.value, 0) }))
    : [];
  return out;
}

export function validateSignal(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const out = {};
  const rec = String(obj.recommendation || obj.action || obj.recommend || 'Hold');
  out.recommendation = ['Buy', 'Hold', 'Sell'].includes(rec) ? rec : rec;
  out.confidence = sanitizeNumber(obj.confidence ?? obj.confidenceScore ?? obj.confidencePercent, 0, 0, 100);
  const rl = String(obj.riskLevel || obj.risk || 'Moderate');
  out.riskLevel = ['Low', 'Moderate', 'High'].includes(rl) ? rl : rl;
  out.explanation = typeof obj.explanation === 'string' ? obj.explanation : obj.reason ? String(obj.reason) : '';
  out.positions = Array.isArray(obj.positions)
    ? obj.positions.map((p) => ({
        coinId: p.coinId || p.id || '',
        symbol: p.symbol || '',
        recommendation: p.recommendation || p.action || 'Hold',
        confidence: sanitizeNumber(p.confidence ?? p.confidencePercent, 0, 0, 100),
        riskLevel: p.riskLevel || p.risk || 'Moderate',
        explanation: p.explanation || p.reason || '',
      }))
    : [];
  return out;
}
