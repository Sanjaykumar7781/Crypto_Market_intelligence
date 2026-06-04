import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell.jsx';
import NewsCard from '../components/NewsCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';

const categories = ['crypto', 'Bitcoin', 'Ethereum', 'Web3', 'Blockchain'];

export default function News() {
  const [category, setCategory] = useState('crypto');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('last15');
  const { data: news = [], loading } = useAsync(() => api.news(category, search), [category, search], 90000);

  const recentDates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 15; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d);
    }
    return arr;
  }, []);

  const formatISO = (d) => d.toISOString().slice(0, 10);

  const filteredNews = useMemo(() => {
    if (loading) return [];
    if (dateFilter === 'last15') {
      const since = new Date();
      since.setDate(since.getDate() - 15);
      return news.filter((n) => new Date(n.publishedAt).getTime() >= since.getTime());
    }
    return news.filter((n) => new Date(n.publishedAt).toISOString().slice(0, 10) === dateFilter);
  }, [news, loading, dateFilter]);

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-premium p-6 rounded-2xl border border-white/8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyanGlow/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between relative z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyanGlow">Market headlines</p>
            <h1 className="mt-3 text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Latest Crypto News</h1>
          </div>
          
          <div className="relative w-full md:max-w-sm">
            <input 
              className="input-premium pl-11 py-2 text-xs" 
              placeholder="Search news..." 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
            />
            <Search className="absolute left-4 top-3 text-slate-400 w-4 h-4" />
          </div>
        </div>
        
        <div className="mt-6 flex gap-2 overflow-x-auto bg-white/3 border border-white/5 rounded-xl p-1 max-w-fit relative z-10">
          {categories.map((item) => (
            <button 
              key={item} 
              onClick={() => setCategory(item)} 
              className={`rounded-lg px-4 py-2 text-xs font-black transition-all ${category === item ? 'bg-cyanGlow text-slate-950 shadow-[0_2px_10px_rgba(40,215,255,0.25)]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {item}
            </button>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Date range:</p>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="input lg:w-44 bg-slate-900 border-white/8 rounded-xl font-bold cursor-pointer h-10 text-xs px-3"
            >
              <option value="last15">Last 15 days</option>
              {recentDates.map((d) => (
                <option key={formatISO(d)} value={formatISO(d)} className="bg-[#050505] text-slate-100">
                  {d.toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 relative z-10">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-2xl" />)
            : filteredNews.map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
      </motion.div>
    </PageShell>
  );
}
