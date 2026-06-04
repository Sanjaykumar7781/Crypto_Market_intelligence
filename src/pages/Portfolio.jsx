import React, { useCallback, useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
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
import { AlertCircle, Brain, Zap, Sparkles, Trash2, Download, Plus } from 'lucide-react';
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
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
          <p className="font-semibold">Render Error</p>
          <p className="text-sm mt-1">Failed to render portfolio. Please refresh the page.</p>
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
              image: coin?.image || null,
            };
          } catch {
            return {
              ...holding,
              currentPrice: 0,
              change24h: 0,
              image: null,
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
      { label: 'Cost Basis', value: totals.totalCost },
      { label: 'Current Value', value: totals.totalValue },
    ],
    [totals],
  );

  const allocationPalette = ['#28d7ff', '#2ff4a6', '#8b5cf6', '#ff4d8d', '#ffc857', '#3b82f6', '#f97316', '#ec4899'];

  function formatPerformanceLabel(current, cost) {
    if (!cost && !current) return 'No holdings yet';
    const diff = current - cost;
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${percent(Math.abs(cost ? (diff / cost) * 100 : 0))}`;
  }

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);

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

      const canvas = await html2canvas(element, { backgroundColor: '#050505', scale: 2 });
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
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          id="portfolio-report"
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyanGlow">Portfolio</p>
              <h1 className="mt-3 text-4xl font-black text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">AI Portfolio Dashboard</h1>
              <p className="mt-2 max-w-2xl text-xs text-slate-400">
                Track your holdings, request portfolio analysis, and get AI trade guidance for Buy/Hold/Sell decisions.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyze}
                className="btn-gradient-premium px-5 py-2.5"
                disabled={analyzing || loading}
                title="Analyze your portfolio with AI"
              >
                <Brain size={16} />
                {analyzing ? 'Analyzing...' : 'AI Portfolio Advisor'}
              </button>
              <button
                onClick={handleSignal}
                className="btn-premium flex items-center gap-2"
                disabled={signalLoading || loading}
                title="Get Buy/Hold/Sell signals"
              >
                <Zap size={16} className="text-amberGlow" />
                {signalLoading ? 'Generating...' : 'Get Trade Signal'}
              </button>
              <button
                onClick={handleExportReport}
                className="btn-premium flex items-center gap-2"
                disabled={loading}
                title="Export portfolio report as PDF"
              >
                <Download size={16} />
                Export PDF Report
              </button>
            </div>
          </div>

          {submissionError && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-bold text-red-400">
              <AlertCircle size={16} />
              {submissionError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-card-premium group" style={{ '--glow-start': 'rgba(6,182,212,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-cyanGlow/5 rounded-full blur-2xl group-hover:bg-cyanGlow/10 transition" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Value</p>
              <p className="mt-2.5 text-2xl font-black text-white">{currency(totals.totalValue, false, currencyCode)}</p>
            </div>
            <div className="metric-card-premium group" style={{ '--glow-start': 'rgba(59,130,246,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Total Cost</p>
              <p className="mt-2.5 text-2xl font-black text-white">{currency(totals.totalCost, false, currencyCode)}</p>
            </div>
            <div className="metric-card-premium group" style={{ '--glow-start': totals.profitLoss >= 0 ? 'rgba(47,244,166,0.2)' : 'rgba(255,77,141,0.2)', '--glow-end': 'rgba(139,92,246,0.15)' }}>
              <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl transition bg-white/5" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Unrealized P/L</p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className={`text-2xl font-black ${totals.profitLoss >= 0 ? 'text-mint' : 'text-roseGlow'}`}>
                  {totals.profitLoss >= 0 ? '+' : ''}{currency(totals.profitLoss, false, currencyCode)}
                </span>
                <span className={`text-xs font-black px-1.5 py-0.5 rounded ${totals.profitLoss >= 0 ? 'bg-mint/10 text-mint' : 'bg-roseGlow/10 text-roseGlow'}`}>
                  {totals.profitLoss >= 0 ? '+' : ''}{percent(totals.profitPct)}
                </span>
              </div>
            </div>
            <div className="metric-card-premium group" style={{ '--glow-start': 'rgba(139,92,246,0.2)', '--glow-end': 'rgba(59,130,246,0.15)' }}>
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Holdings Count</p>
              <p className="mt-2.5 text-2xl font-black text-white">{holdingsWithPrice.length}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="glass-premium rounded-2xl p-5 border border-white/8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h2 className="text-base font-black tracking-tight text-white">Portfolio Distribution</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Allocation share by asset current valuation</p>
                </div>
                <span className="text-xs font-bold text-cyanGlow bg-cyanGlow/10 border border-cyanGlow/10 px-3 py-1 rounded-lg">
                  {allocationData.length} Assets
                </span>
              </div>
              <div className="mt-4 h-72">
                {allocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
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
                  <div className="flex h-full items-center justify-center text-xs text-slate-500 italic">Add holdings to visualize asset allocation share.</div>
                )}
              </div>
            </div>

            <div className="glass-premium rounded-2xl p-5 border border-white/8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div>
                  <h2 className="text-base font-black tracking-tight text-white">Portfolio Performance</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Holdings current value comparison against total cost</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg ${totals.totalValue >= totals.totalCost ? 'bg-mint/10 text-mint' : 'bg-roseGlow/10 text-roseGlow'}`}>
                  {formatPerformanceLabel(totals.totalValue, totals.totalCost)}
                </span>
              </div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} />
                    <YAxis tickFormatter={(value) => currency(value, false, currencyCode)} tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} />
                    <Tooltip formatter={(value) => currency(value, false, currencyCode)} />
                    <Area type="monotone" dataKey="value" stroke="#0EA5E9" fill="url(#performanceGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-premium rounded-2xl p-6 border border-white/8 shadow-2xl">
            <div className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
              <Plus className="text-cyanGlow" size={18} />
              <h2 className="text-base font-black text-white tracking-tight">Add New Asset Holding</h2>
            </div>
            
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleAddHolding}>
              <input
                value={form.coinId}
                onChange={(event) => handleFormChange('coinId', event.target.value)}
                placeholder="Coin ID (e.g. bitcoin)"
                className="input-premium col-span-2 text-xs"
              />
              <input
                value={form.symbol}
                onChange={(event) => handleFormChange('symbol', event.target.value)}
                placeholder="Symbol (e.g. BTC)"
                className="input-premium text-xs"
              />
              <input
                value={form.amount}
                onChange={(event) => handleFormChange('amount', event.target.value)}
                placeholder="Amount"
                type="number"
                min="0"
                step="any"
                className="input-premium text-xs"
              />
              <input
                value={form.averageBuyPrice}
                onChange={(event) => handleFormChange('averageBuyPrice', event.target.value)}
                placeholder="Avg Buy Price"
                type="number"
                min="0"
                step="any"
                className="input-premium text-xs"
              />
              <textarea
                value={form.notes}
                onChange={(event) => handleFormChange('notes', event.target.value)}
                placeholder="Holding notes (optional)"
                className="input-premium col-span-2 sm:col-span-3 text-xs h-12 py-2 resize-none"
              />
              <div className="lg:col-span-2 flex items-end">
                <button type="submit" className="btn-gradient-premium w-full text-xs font-black uppercase tracking-wider py-3" disabled={loading}>
                  Add Asset
                </button>
              </div>
            </form>
          </div>

          <div className="glass-premium rounded-2xl p-5 border border-white/8 shadow-2xl">
            <div className="mb-4 border-b border-white/5 pb-3">
              <h2 className="text-base font-black text-white tracking-tight">Holdings & Allocations</h2>
            </div>
            {loading ? (
              <p className="text-xs text-slate-400 italic">Loading portfolio assets...</p>
            ) : holdingsWithPrice.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-auto">
                  <thead className="text-xs text-slate-400 uppercase tracking-wider border-b border-white/5 bg-white/[0.01]">
                    <tr>
                      <th className="text-left py-3.5 pl-4">Asset</th>
                      <th className="text-right py-3.5">Amount</th>
                      <th className="text-right py-3.5">Avg Price</th>
                      <th className="text-right py-3.5">Current Price</th>
                      <th className="text-right py-3.5">Value</th>
                      <th className="text-right py-3.5 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-black/10">
                    {holdingsWithPrice.map((holding) => (
                      <tr key={holding._id} className="hover:bg-white/[0.02] transition duration-200">
                        <td className="py-4 pl-4 text-left">
                          <div className="flex items-center gap-2.5">
                            {holding.image ? (
                              <img src={holding.image} alt="" className="size-7 rounded-full bg-white/5 p-0.5" />
                            ) : (
                              <div className="size-7 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {holding.symbol[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-white text-sm leading-none">{holding.symbol}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{holding.coinId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-semibold text-white text-xs">{holding.amount}</td>
                        <td className="py-4 text-right font-medium text-slate-300 text-xs">{currency(Number(holding.averageBuyPrice) || 0, false, currencyCode)}</td>
                        <td className="py-4 text-right font-semibold text-white text-xs">
                          {currency(Number(holding.currentPrice) || 0, false, currencyCode)}
                          <span className={`text-[10px] ml-1.5 ${holding.change24h >= 0 ? 'text-mint' : 'text-roseGlow'}`}>
                            {holding.change24h >= 0 ? '▲' : '▼'}{Math.abs(holding.change24h || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 text-right font-black text-cyanGlow text-xs">{currency((Number(holding.currentPrice) || 0) * (Number(holding.amount) || 0), false, currencyCode)}</td>
                        <td className="py-4 text-right pr-4">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 transition"
                            onClick={() => handleRemoveHolding(holding._id)}
                            title="Remove asset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-slate-500 text-center text-xs italic">No holdings yet. Add your first asset holding using the form above.</div>
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* AI Portfolio Health Card */}
            <div className="glass-premium rounded-2xl p-5 border border-white/8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
              <div>
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-tight">AI Portfolio Health</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Asset Diversification & Risk</p>
                  </div>
                </div>
                
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-500">Health Score</p>
                      <p className="mt-1 text-2xl font-black text-emerald-400">{healthMetrics.healthScore}<span className="text-xs font-normal text-slate-500">/100</span></p>
                    </div>
                    <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-500">Risk Score</p>
                      <p className="mt-1 text-2xl font-black text-cyanGlow">{healthMetrics.riskScore}<span className="text-xs font-normal text-slate-500">/100</span></p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Risk Exposure</span>
                      <span className="font-bold text-white">{healthMetrics.riskLevel} Risk</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyanGlow to-purple-600 rounded-full"
                        style={{ width: `${healthMetrics.riskScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs leading-6 text-slate-300 bg-white/3 border border-white/5 rounded-xl p-3.5 mt-2">
                    {analysis ? (
                      analysis.error ? (
                        <p className="text-red-400">{analysis.error}</p>
                      ) : (
                        <p className="whitespace-pre-wrap">{analysis.strengths?.[0] || analysis.summary || analysis.raw || 'AI health summary available.'}</p>
                      )
                    ) : (
                      <p className="text-slate-400 italic">Run the AI Portfolio Advisor to see detailed diversification recommendations.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Rebalancing suggestions Card */}
            <div className="glass-premium rounded-2xl p-5 border border-white/8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyanGlow/10 blur-3xl pointer-events-none rounded-full" />
              <div>
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                  <div className="p-2 rounded-xl bg-cyanGlow/10 text-cyanGlow shadow-[0_0_15px_rgba(40,215,255,0.15)]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-tight">AI Rebalancing Suggestions</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Asset Reallocation Model</p>
                  </div>
                </div>
                
                <div className="mt-5">
                  <div className="text-xs leading-6 text-slate-300 bg-white/3 border border-white/5 rounded-xl p-3.5 min-h-[160px] max-h-[220px] overflow-y-auto">
                    {analysis ? (
                      analysis.rebalance ? (
                        <p className="whitespace-pre-wrap">{analysis.rebalance}</p>
                      ) : analysis.raw ? (
                        <p className="whitespace-pre-wrap">{analysis.raw}</p>
                      ) : (
                        <p className="text-slate-400 italic">No recommendations returned.</p>
                      )
                    ) : (
                      <p className="text-slate-400 italic">Run the advisor to generate rebalancing advice based on your current asset allocations.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Trade Signal Card */}
            <div className="glass-premium rounded-2xl p-5 border border-white/8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amberGlow/10 blur-3xl pointer-events-none rounded-full" />
              <div>
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                  <div className="p-2 rounded-xl bg-amberGlow/10 text-amberGlow shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-tight">AI Trade Signals</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Market Opportunity Scan</p>
                  </div>
                </div>
                
                <div className="mt-5 space-y-4">
                  {signal ? (
                    signal.error ? (
                      <div className="text-xs leading-6 text-slate-300 bg-white/3 border border-white/5 rounded-xl p-3.5">
                        <p className="text-red-400">{signal.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl p-3.5">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-500">Recommendation</p>
                            <p className="mt-1 text-lg font-black text-white capitalize">{signal.recommendation || 'Hold'}</p>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                            signal.recommendation?.toLowerCase().includes('buy') ? 'bg-mint/10 text-mint' :
                            signal.recommendation?.toLowerCase().includes('sell') ? 'bg-roseGlow/10 text-roseGlow' :
                            'bg-cyanGlow/10 text-cyanGlow'
                          }`}>
                            {signal.recommendation || 'Hold'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Confidence</p>
                            <p className="mt-1 text-base font-black text-white">{signal.confidence ?? 'N/A'}%</p>
                          </div>
                          <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Risk Level</p>
                            <p className="mt-1 text-base font-black text-white capitalize">{signal.riskLevel || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="text-xs leading-6 text-slate-300 bg-white/3 border border-white/5 rounded-xl p-3.5 max-h-[100px] overflow-y-auto">
                          <p>{signal.explanation || signal.reason || signal.raw || 'No details available.'}</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-xs leading-6 text-slate-400 bg-white/3 border border-white/5 rounded-xl p-3.5 italic">
                      Request a trade signal to see the AI&apos;s latest market actions and positions recommendation.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-premium rounded-2xl p-5 border border-white/8 shadow-2xl relative overflow-hidden">
            <div className="mb-4 border-b border-white/5 pb-2">
              <h2 className="text-base font-black text-white tracking-tight">Recommended Coins</h2>
            </div>
            {analysis?.recommendations ? (
              formatList(analysis.recommendations)
            ) : (
              <p className="text-xs text-slate-400 italic">Run the advisor to get recommended coins tailored to your holdings.</p>
            )}
          </div>
        </motion.div>
      </PageShell>
    </PortfolioErrorBoundary>
  );
}
