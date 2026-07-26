import React, { useCallback, useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion } from 'framer-motion';
import { AlertCircle, Brain, Zap, Download, X } from 'lucide-react';
import PageShell from '../components/PageShell.jsx';
import { api } from '../services/api.js';
import { currency, percent } from '../utils/format.js';
import { useCurrency } from '../hooks/useCurrency.js';

// Import all new modular components
import AIAssetDistribution from '../components/portfolio/AIAssetDistribution.jsx';
import AIPerformanceTimeline from '../components/portfolio/AIPerformanceTimeline.jsx';
import AIForecast from '../components/portfolio/AIForecast.jsx';
import AIInsightsPanel from '../components/portfolio/AIInsightsPanel.jsx';
import HoldingsTable from '../components/portfolio/HoldingsTable.jsx';
import AssetHoldingsManager from '../components/portfolio/AssetHoldingsManager.jsx';
import PortfolioHealth from '../components/portfolio/PortfolioHealth.jsx';
import RebalancingSuggestions from '../components/portfolio/RebalancingSuggestions.jsx';
import AITradeSignals from '../components/portfolio/AITradeSignals.jsx';
import RecommendedCoins from '../components/portfolio/RecommendedCoins.jsx';

function normalizeAnalysisPayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') return { raw: payload };
  if (payload.analysis && typeof payload.analysis === 'object') {
    return { ...payload.analysis, raw: payload.raw || undefined };
  }
  if (payload.raw) return payload;
  return payload;
}

function normalizeSignalPayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') return { raw: payload };
  if (payload.signal && typeof payload.signal === 'object') {
    return { ...payload.signal, raw: payload.raw || undefined };
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
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400 m-8">
          <p className="font-bold">Portfolio Rendering Error</p>
          <p className="text-sm mt-1">Failed to render portfolio modules. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const VALID_FORM_FIELDS = ['coinId', 'symbol', 'amount', 'averageBuyPrice', 'notes', 'purchaseDate', 'exchange', 'currency'];

export default function Portfolio() {
  const { currency: currencyValue, currencyCode } = useCurrency();
  const [holdingsWithPrice, setHoldingsWithPrice] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const [signal, setSignal] = useState(null);
  const [signalLoading, setSignalLoading] = useState(false);
  
  const [form, setForm] = useState({ 
    coinId: '', symbol: '', amount: '', averageBuyPrice: '', notes: '', 
    purchaseDate: new Date().toISOString().split('T')[0], exchange: '', currency: 'USD' 
  });
  const [submissionError, setSubmissionError] = useState(null);

  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);

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

  const healthMetrics = useMemo(() => {
    const holdingsCount = holdingsWithPrice.length;
    const allocationData = holdingsWithPrice
      .map(h => (h.currentPrice * h.amount))
      .filter(v => v > 0);
    const total = allocationData.reduce((a,b) => a+b, 0);
    
    const maxWeight = allocationData.length && total ? Math.max(...allocationData) / total * 100 : 0;
    const diversificationScore = Math.min(100, Math.round((Math.min(holdingsCount, 10) / 10) * 100));
    
    const averageVolatility = holdingsCount
      ? holdingsWithPrice.reduce((sum, holding) => sum + Math.abs(holding.change24h || 0), 0) / holdingsCount
      : 0;
      
    const riskScore = Math.min(100, Math.max(5, Math.round(30 + maxWeight * 0.4 + averageVolatility * 1.2 + (holdingsCount <= 1 ? 20 : 0))));
    const healthScore = Math.min(100, Math.max(0, Math.round(100 - riskScore + diversificationScore * 0.25)));
    const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Moderate' : 'Low';
    
    return { healthScore, riskScore, riskLevel, diversificationScore };
  }, [holdingsWithPrice]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await api.portfolio.analyze();
      if (!res) {
        setAnalysis({ error: 'No response from server' });
        document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (res.data?.error) {
        setAnalysis({ error: res.data.error });
        document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const normalized = normalizeAnalysisPayload(res);
      setAnalysis(normalized || { error: 'Invalid analysis format received' });
      document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Portfolio analyze failed', error);
      setAnalysis({ error: error?.message || 'Analysis temporarily unavailable. Please try again.' });
      document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
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
        document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (res.data?.error) {
        setSignal({ error: res.data.error });
        document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      const normalized = normalizeSignalPayload(res);
      setSignal(normalized || { error: 'Invalid signal format received' });
      document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Trade signal failed', error);
      setSignal({ error: error?.message || 'Trade signal failed. Please try again later.' });
      document.getElementById('ai-suite-section')?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSignalLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const element = document.getElementById('portfolio-report');
      if (!element) return;
      
      const canvas = await html2canvas(element, { scale: 1.5, useCORS: true, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let position = 0;
      let heightLeft = pdfHeight;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('Portfolio_Accurate_Report.pdf');
    } catch (error) {
      console.error('Export report failed', error);
      setSubmissionError('Failed to export fully accurate PDF. Please try again.');
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
          className="flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400 mb-2">My Assets</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI Portfolio Dashboard</h1>
              <p className="mt-2 text-xs font-bold text-gray-500 max-w-xl leading-relaxed">
                Track your holdings in real-time, instantly calculate unrealized P/L, and execute data-driven trades using institutional-grade AI signals and health scores.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyze}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-black tracking-wider uppercase shadow-sm transition disabled:opacity-50"
                disabled={analyzing || loading}
              >
                <Brain size={16} />
                {analyzing ? 'Analyzing...' : 'AI Advisor'}
              </button>
              <button
                onClick={handleSignal}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-black tracking-wider uppercase shadow-sm transition disabled:opacity-50"
                disabled={signalLoading || loading}
              >
                <Zap size={16} className="text-amber-500" />
                {signalLoading ? 'Generating...' : 'Trade Signal'}
              </button>
              <button
                onClick={handleExportReport}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-black tracking-wider uppercase shadow-sm transition disabled:opacity-50"
                disabled={loading}
              >
                <Download size={16} className="text-gray-500" />
                Export PDF
              </button>
            </div>
          </div>

          {submissionError && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-600">
              <AlertCircle size={16} />
              {submissionError}
            </div>
          )}

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard 
              label="Total Balance" 
              value={currency(totals.totalValue, false, currencyCode)} 
              sub={null}
            />
            <MetricCard 
              label="Cost Basis" 
              value={currency(totals.totalCost, false, currencyCode)} 
              sub={null}
            />
            <MetricCard 
              label="Unrealized P/L" 
              value={`${totals.profitLoss >= 0 ? '+' : ''}${currency(totals.profitLoss, false, currencyCode)}`} 
              sub={`${totals.profitLoss >= 0 ? '+' : ''}${percent(totals.profitPct)}`}
              color={totals.profitLoss >= 0 ? 'text-teal-500' : 'text-rose-500'}
              subColor={totals.profitLoss >= 0 ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'}
            />
            <MetricCard 
              label="Assets Held" 
              value={holdingsWithPrice.length} 
              sub={null}
            />
          </div>

          {/* Main AI Dashboard Row */}
          <div className="flex flex-col gap-6">
            <AIAssetDistribution holdingsWithPrice={holdingsWithPrice} totalValue={totals.totalValue} />
            <AIPerformanceTimeline holdingsWithPrice={holdingsWithPrice} totalValue={totals.totalValue} totalCost={totals.totalCost} />
          </div>

          {/* AI Forecast & Insights Row */}
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <AIForecast holdingsWithPrice={holdingsWithPrice} totalValue={totals.totalValue} />
            <AIInsightsPanel holdingsWithPrice={holdingsWithPrice} totalValue={totals.totalValue} />
          </div>

          {/* Asset Holdings Manager (Table, Modal, Drawer, Summary, Filters) */}
          <AssetHoldingsManager 
            holdingsWithPrice={holdingsWithPrice}
            handleRemoveHolding={handleRemoveHolding}
            loading={loading}
            totals={totals}
            form={form}
            handleFormChange={handleFormChange}
            handleAddHolding={handleAddHolding}
          />

          {/* AI Suite Row */}
          <div id="ai-suite-section" className="grid gap-6 lg:grid-cols-3">
            <PortfolioHealth healthMetrics={healthMetrics} analysis={analysis} />
            <RebalancingSuggestions analysis={analysis} />
            <AITradeSignals signal={signal} />
          </div>

          {/* Recommended Coins */}
          <RecommendedCoins analysis={analysis} />

        </motion.div>
      </PageShell>
    </PortfolioErrorBoundary>
  );
}

function MetricCard({ label, value, sub, color = "text-gray-900", subColor }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm group hover:shadow-md transition">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="mt-2.5 flex items-end gap-2">
        <p className={`text-2xl font-black ${color} leading-none`}>{value}</p>
        {sub && (
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded leading-none ${subColor}`}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
