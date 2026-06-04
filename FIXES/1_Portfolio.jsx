import React, { useCallback, useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import { api } from '../services/api.js';
import { currency, percent } from '../utils/format.js';
import { useCurrency } from '../hooks/useCurrency.js';

function formatList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return <span className="text-slate-400">No recommendations available.</span>;
  }

  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
      {items.map((item, index) => (
        <li key={`${item?.name || item}-${index}`}>
          {typeof item === 'string' ? item : item.name || item}
          {item?.reason ? ` — ${item.reason}` : ''}
        </li>
      ))}
    </ul>
  );
}

function normalizeAnalysisPayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') return { raw: payload };
  if (payload.analysis && typeof payload.analysis === 'object') {
    return {
      ...payload.analysis,
      raw: payload.raw || undefined,
    };
  }
  if (payload.raw) return payload;
  return payload;
}

function normalizeSignalPayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') return { raw: payload };
  if (payload.signal && typeof payload.signal === 'object') {
    return {
      ...payload.signal,
      raw: payload.raw || undefined,
    };
  }
  if (payload.raw) return payload;
  return payload;
}

// Error boundary component
class PortfolioErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Portfolio render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          <p className="font-semibold">Render Error</p>
          <p className="text-sm">Failed to render portfolio. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const VALID_FORM_FIELDS = ['coinId', 'symbol', 'amount', 'averageBuyPrice', 'notes'];

export default function Portfolio() {
  const { currency: currencyValue, currencyCode } = useCurrency();
  const [holdingsWithPrice, setHoldingsWithPrice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [signal, setSignal] = useState(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [form, setForm] = useState({ coinId: '', symbol: '', amount: '', averageBuyPrice: '', notes: '' });
  const [submissionError, setSubmissionError] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setSubmissionError(null);

    try {
      const res = await api.portfolio.get();
      const data = res?.data || res;
      const holdings = Array.isArray(data?.holdings) ? data.holdings : [];

      const details = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const coin = await api.coin(holding.coinId, currencyValue);
            return {
              ...holding,
              currentPrice: coin?.currentPrice || 0,
              symbol: holding.symbol || coin?.symbol || holding.coinId,
              change24h: coin?.change24h || 0,
            };
          } catch {
            return {
              ...holding,
              currentPrice: 0,
              change24h: 0,
            };
          }
        }),
      );

      setHoldingsWithPrice(details);
    } catch (error) {
      setHoldingsWithPrice([]);
      console.error('Failed to fetch portfolio', error);
      setSubmissionError('Failed to load portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currencyValue]);

  useEffect(() => {
    let isMounted = true;
    fetchPortfolio().finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [fetchPortfolio]);

  const totals = useMemo(() => {
    const totalValue = holdingsWithPrice.reduce((sum, holding) => sum + (holding.currentPrice || 0) * (Number(holding.amount) || 0), 0);
    const totalCost = holdingsWithPrice.reduce((sum, holding) => sum + (Number(holding.averageBuyPrice) || 0) * (Number(holding.amount) || 0), 0);
    const profitLoss = totalValue - totalCost;
    const profitPct = totalCost ? (profitLoss / totalCost) * 100 : 0;
    return { totalValue, totalCost, profitLoss, profitPct };
  }, [holdingsWithPrice]);

  const allocationData = useMemo(() => {
    const entries = holdingsWithPrice.map((holding) => {
      const value = (Number(holding.currentPrice) || 0) * (Number(holding.amount) || 0);
      return {
        name: holding.symbol || holding.coinId,
        value,
      };
    });

    const filtered = entries.filter((item) => item.value > 0);
    const total = filtered.reduce((sum, item) => sum + item.value, 0);
    return filtered.map((item) => ({
      ...item,
      percent: total ? Number(((item.value / total) * 100).toFixed(1)) : 0,
    }));
  }, [holdingsWithPrice]);

  const healthMetrics = useMemo(() => {
    const holdingsCount = holdingsWithPrice.length;
    const maxWeight = allocationData.length ? Math.max(...allocationData.map((item) => item.percent)) : 0;
    const diversificationScore = Math.min(100, Math.round((Math.min(holdingsCount, 10) / 10) * 100));
    const averageVolatility = holdingsWithPrice.length
      ? holdingsWithPrice.reduce((sum, holding) => sum + Math.abs(holding.change24h || 0), 0) / holdingsWithPrice.length
      : 0;
    const riskScore = Math.min(100, Math.max(5, Math.round(30 + maxWeight * 0.4 + averageVolatility * 1.2 + (holdingsCount <= 1 ? 20 : 0))));
    const healthScore = Math.min(100, Math.max(0, Math.round(100 - riskScore + diversificationScore * 0.25)));
    const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Moderate' : 'Low';
    return { holdingsCount, maxWeight, diversificationScore, averageVolatility, riskScore, healthScore, riskLevel };
  }, [allocationData, holdingsWithPrice]);

  const performanceData = useMemo(
    () => [
      { label: 'Cost basis', value: totals.totalCost },
      { label: 'Current value', value: totals.totalValue },
    ],
    [totals],
  );

  const allocationPalette = ['#22C55E', '#0EA5E9', '#F59E0B', '#E11D48', '#8B5CF6', '#0F766E', '#F97316', '#38BDF8'];

  function formatPerformanceLabel(current, cost) {
    if (!cost && !current) return 'No holdings yet';
    const diff = current - cost;
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${percent(Math.abs(cost ? (diff / cost) * 100 : 0))}`;
  }

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    setSignal(null);

    try {
      const res = await api.portfolio.analyze();

      if (!res) {
        setAnalysis({ error: 'No response from server' });
        return;
      }

      if (res.data?.error) {
        setAnalysis({ error: res.data.error });
        return;
      }

      const normalized = normalizeAnalysisPayload(res);
      if (!normalized) {
        setAnalysis({ error: 'Invalid analysis format received' });
        return;
      }

      setAnalysis(normalized);
    } catch (error) {
      console.error('Portfolio analyze failed', error);
      setAnalysis({ error: error?.message || 'Analysis temporarily unavailable. Please try again.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSignal = async () => {
    setSignalLoading(true);
    setSignal(null);

    try {
      const res = await api.portfolio.signal();

      if (!res) {
        setSignal({ error: 'No response from server' });
        return;
      }

      if (res.data?.error) {
        setSignal({ error: res.data.error });
        return;
      }

      const normalized = normalizeSignalPayload(res);
      if (!normalized) {
        setSignal({ error: 'Invalid signal format received' });
        return;
      }

      setSignal(normalized);
    } catch (error) {
      console.error('Trade signal failed', error);
      setSignal({ error: error?.message || 'Trade signal failed. Please try again later.' });
    } finally {
      setSignalLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const element = document.getElementById('portfolio-report');
      if (!element) return;

      const canvas = await html2canvas(element, { backgroundColor: '#0b1120', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('portfolio-report.pdf');
    } catch (error) {
      console.error('Export report failed', error);
      setSubmissionError('Failed to export PDF. Please try again.');
    }
  };

  const handleFormChange = (field, value) => {
    if (!VALID_FORM_FIELDS.includes(field)) return;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddHolding = async (event) => {
    event.preventDefault();
    setSubmissionError(null);

    const { coinId, symbol, amount, averageBuyPrice, notes } = form;

    if (!coinId || !symbol || !amount) {
      setSubmissionError('Coin ID, symbol, and amount are required.');
      return;
    }

    setLoading(true);

    try {
      await api.portfolio.addHolding({
        coinId: coinId.toLowerCase().trim(),
        symbol: symbol.toUpperCase().trim(),
        amount: Number(amount),
        averageBuyPrice: Number(averageBuyPrice) || 0,
        notes: notes.trim(),
      });
      setForm({ coinId: '', symbol: '', amount: '', averageBuyPrice: '', notes: '' });
      await fetchPortfolio();
    } catch (error) {
      console.error('Failed to add holding', error);
      setSubmissionError('Unable to add holding. Check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveHolding = async (holdingId) => {
    setLoading(true);
    setSubmissionError(null);

    try {
      await api.portfolio.removeHolding(holdingId);
      await fetchPortfolio();
    } catch (error) {
      console.error('Failed to remove holding', error);
      setSubmissionError('Unable to remove holding. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortfolioErrorBoundary>
      <PageShell>
        <div id="portfolio-report" className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyanGlow">Portfolio</p>
              <h1 className="mt-3 text-4xl font-black">AI Portfolio Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Track your holdings, request portfolio analysis, and get AI trade guidance for Buy/Hold/Sell decisions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyze}
                className="gradient-button"
                disabled={analyzing || loading}
                title="Analyze your portfolio with AI"
              >
                {analyzing ? 'Analyzing...' : 'AI Portfolio Advisor'}
              </button>
              <button
                onClick={handleSignal}
                className="secondary-button"
                disabled={signalLoading || loading}
                title="Get Buy/Hold/Sell signals"
              >
                {signalLoading ? 'Generating signal...' : 'Get Buy/Hold/Sell Signal'}
              </button>
              <button
                onClick={handleExportReport}
                className="secondary-button"
                disabled={loading}
                title="Export portfolio report as PDF"
              >
                Export PDF Report
              </button>
            </div>
          </div>

          {submissionError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle size={16} />
              {submissionError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
            <div className="metric-card">
              <p className="text-xs uppercase text-slate-400">Total Value</p>
              <p className="mt-2 text-xl font-extrabold">{currency(totals.totalValue, false, currencyCode)}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs uppercase text-slate-400">Total Cost</p>
              <p className="mt-2 text-xl font-extrabold">{currency(totals.totalCost, false, currencyCode)}</p>
            </div>
            <div className="metric-card">
              <p className="text-xs uppercase text-slate-400">Unrealized P/L</p>
              <p className={`mt-2 text-xl font-extrabold ${totals.profitLoss >= 0 ? 'text-mint' : 'text-roseGlow'}`}>
                {currency(totals.profitLoss, false, currencyCode)} <span className="text-sm">({percent(totals.profitPct)})</span>
              </p>
            </div>
            <div className="metric-card">
              <p className="text-xs uppercase text-slate-400">Holdings Count</p>
              <p className="mt-2 text-xl font-extrabold">{holdingsWithPrice.length}</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="glass rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">Portfolio Distribution</h2>
                  <p className="text-sm text-slate-400">Allocation by current value.</p>
                </div>
                <p className="text-sm text-slate-400">{allocationData.length} assets</p>
              </div>
              <div className="mt-4 h-72">
                {allocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <RechartsPieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={96}
                        paddingAngle={4}
                        stroke="transparent"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={entry.name} fill={allocationPalette[index % allocationPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => currency(value, false, currencyCode)} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">Add holdings to visualize allocation.</div>
                )}
              </div>
            </div>

            <div className="glass rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">Portfolio Performance</h2>
                  <p className="text-sm text-slate-400">Current value vs cost basis.</p>
                </div>
                <p className="text-sm text-slate-400">{formatPerformanceLabel(totals.totalValue, totals.totalCost)}</p>
              </div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <AreaChart data={performanceData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <YAxis tickFormatter={(value) => currency(value, false, currencyCode)} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <Tooltip formatter={(value) => currency(value, false, currencyCode)} />
                    <Area type="monotone" dataKey="value" stroke="#0EA5E9" fill="url(#performanceGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <h2 className="text-lg font-extrabold mb-4">Add New Holding</h2>
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleAddHolding}>
              <input
                value={form.coinId}
                onChange={(event) => handleFormChange('coinId', event.target.value)}
                placeholder="Coin ID (e.g. bitcoin)"
                className="input-field col-span-2"
              />
              <input
                value={form.symbol}
                onChange={(event) => handleFormChange('symbol', event.target.value)}
                placeholder="Symbol (e.g. BTC)"
                className="input-field"
              />
              <input
                value={form.amount}
                onChange={(event) => handleFormChange('amount', event.target.value)}
                placeholder="Amount"
                type="number"
                min="0"
                step="any"
                className="input-field"
              />
              <input
                value={form.averageBuyPrice}
                onChange={(event) => handleFormChange('averageBuyPrice', event.target.value)}
                placeholder="Avg buy price"
                type="number"
                min="0"
                step="any"
                className="input-field"
              />
              <textarea
                value={form.notes}
                onChange={(event) => handleFormChange('notes', event.target.value)}
                placeholder="Notes (optional)"
                className="input-field col-span-2 sm:col-span-3"
              />
              <button type="submit" className="gradient-button" disabled={loading}>
                Add Holding
              </button>
            </form>
          </div>

          <div className="glass rounded-lg p-4">
            <h2 className="text-lg font-extrabold mb-3">Holdings</h2>
            {loading ? (
              <p>Loading portfolio...</p>
            ) : holdingsWithPrice.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-400 uppercase tracking-[0.16em]">
                    <tr>
                      <th className="text-left py-3">Asset</th>
                      <th className="text-right py-3">Amount</th>
                      <th className="text-right py-3">Avg Price</th>
                      <th className="text-right py-3">Current Price</th>
                      <th className="text-right py-3">Value</th>
                      <th className="text-right py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdingsWithPrice.map((holding) => (
                      <tr key={holding._id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="py-3">{holding.symbol || holding.coinId}</td>
                        <td className="py-3 text-right">{holding.amount}</td>
                        <td className="py-3 text-right">{currency(Number(holding.averageBuyPrice) || 0, false, currencyCode)}</td>
                        <td className="py-3 text-right">{currency(Number(holding.currentPrice) || 0, false, currencyCode)}</td>
                        <td className="py-3 text-right">{currency((Number(holding.currentPrice) || 0) * (Number(holding.amount) || 0), false, currencyCode)}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            className="text-sm font-semibold uppercase tracking-[0.18em] text-roseGlow hover:text-white"
                            onClick={() => handleRemoveHolding(holding._id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-slate-400">No holdings yet. Add your first holding above.</div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="glass rounded-lg p-4">
              <h2 className="text-lg font-extrabold mb-3">AI Portfolio Health</h2>
              <div className="space-y-4 text-sm text-slate-200">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="metric-card">
                    <p className="text-xs uppercase text-slate-400">Risk Score</p>
                    <p className="mt-2 text-2xl font-black text-cyanGlow">{healthMetrics.riskScore}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs uppercase text-slate-400">Health Score</p>
                    <p className="mt-2 text-2xl font-black text-emerald-300">{healthMetrics.healthScore}</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs uppercase text-slate-400">Diversification</p>
                    <p className="mt-2 text-2xl font-black">{healthMetrics.diversificationScore}%</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs uppercase text-slate-400">Holdings</p>
                    <p className="mt-2 text-2xl font-black">{healthMetrics.holdingsCount}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase text-slate-400">Risk level</p>
                  <div className="mt-2 rounded-full bg-slate-800 p-1">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-roseGlow to-cyanGlow"
                      style={{ width: `${healthMetrics.riskScore}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{healthMetrics.riskLevel} risk with {healthMetrics.maxWeight}% concentration in the largest holding.</p>
                </div>

                {analysis ? (
                  analysis.error ? (
                    <p className="text-slate-300">{analysis.error}</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase text-slate-400">AI risk summary</p>
                        <p className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">
                          {analysis.strengths?.[0] || analysis.summary || analysis.raw || 'AI analysis is ready.'}
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <p className="text-slate-400">Run the AI Portfolio Advisor to see health metrics and diversification insights.</p>
                )}
              </div>
            </div>

            <div className="glass rounded-lg p-4">
              <h2 className="text-lg font-extrabold mb-3">AI Rebalancing Suggestions</h2>
              {analysis ? (
                analysis.rebalance ? (
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{analysis.rebalance}</p>
                ) : analysis.raw ? (
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{analysis.raw}</p>
                ) : (
                  <p className="text-slate-400">Use the advisor to receive rebalancing guidance.</p>
                )
              ) : (
                <p className="text-slate-400">Use the advisor to receive rebalancing guidance.</p>
              )}
            </div>

            <div className="glass rounded-lg p-4">
              <h2 className="text-lg font-extrabold mb-3">AI Trade Signal</h2>
              {signal ? (
                signal.error ? (
                  <p className="text-slate-300">{signal.error}</p>
                ) : (
                  <div className="space-y-4 text-sm text-slate-200">
                    <div>
                      <p className="text-xs uppercase text-slate-400">Recommendation</p>
                      <p className="mt-1 text-xl font-bold">{signal.recommendation || signal.raw || 'N/A'}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase text-slate-400">Confidence</p>
                        <p className="mt-1">{signal.confidence ?? 'N/A'}%</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Risk Level</p>
                        <p className="mt-1">{signal.riskLevel || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-slate-400">Explanation</p>
                        <p className="mt-1 text-xs whitespace-pre-wrap text-slate-200">{signal.explanation || signal.reason || signal.raw || 'No details available.'}</p>
                      </div>
                    </div>
                    {Array.isArray(signal.positions) && signal.positions.length > 0 ? (
                      <div>
                        <p className="text-xs uppercase text-slate-400">Position Signals</p>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-200">
                          {signal.positions.map((position, index) => (
                            <li key={`${position.coinId || position.symbol || index}-${index}`} className="leading-6">
                              <span className="font-semibold">{position.symbol || position.coinId || 'Asset'}</span>: {position.recommendation || 'Hold'} • {position.confidence ?? 'N/A'}% • {position.riskLevel || 'N/A'} • {position.explanation || position.reason || ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )
              ) : (
                <p className="text-slate-400">Request a buy/hold/sell signal to see an AI market recommendation.</p>
              )}
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <h2 className="text-lg font-extrabold mb-3">Recommended Coins</h2>
            {analysis?.recommendations ? (
              formatList(analysis.recommendations)
            ) : (
              <p className="text-slate-400">Run the advisor to get recommended coins tailored to your holdings.</p>
            )}
          </div>
        </div>
      </PageShell>
    </PortfolioErrorBoundary>
  );
}
