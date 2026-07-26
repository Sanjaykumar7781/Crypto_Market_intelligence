import { useState, useMemo } from 'react';
import { Search, Flame, Clock, Newspaper, SearchX } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell.jsx';
import NewsCard from '../components/NewsCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { api } from '../services/api.js';
import { useAsync } from '../hooks/useAsync.js';

const categories = ['All', 'Bitcoin', 'Ethereum', 'DeFi', 'NFT', 'Web3', 'Regulation', 'Altcoins', 'Mining'];

export default function News() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('last15');
  
  // Map 'All' to 'crypto' for API
  const apiCategory = category === 'All' ? 'crypto' : category;
  const { data: news = [], loading } = useAsync(() => api.news(apiCategory, search), [apiCategory, search], 90000);

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
    const safeNews = Array.isArray(news) ? news : [];
    if (dateFilter === 'last15') {
      const since = new Date();
      since.setDate(since.getDate() - 15);
      return safeNews.filter((n) => new Date(n.publishedAt).getTime() >= since.getTime());
    }
    return safeNews.filter((n) => new Date(n.publishedAt).toISOString().slice(0, 10) === dateFilter);
  }, [news, loading, dateFilter]);

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        
        {/* Split Header Section */}
        <section className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
          {/* Left: Headline & Filters */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs mb-3">
                <Newspaper size={16} /> Market Headlines
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Latest Crypto News</h1>
              <p className="text-gray-500 max-w-xl text-sm leading-relaxed mb-8">
                Stay updated with the most important stories across the cryptocurrency and blockchain ecosystem. Filter by your favorite sectors and topics.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 mt-auto">
              {/* Pill Categories (Horizontal Scroll) */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {categories.map((item) => (
                  <button 
                    key={item} 
                    onClick={() => setCategory(item)} 
                    className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-all ${category === item ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              
              {/* Date Filter */}
              <div className="flex items-center gap-3 mt-2">
                <Clock size={16} className="text-gray-400" />
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                  className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 cursor-pointer outline-none font-semibold"
                >
                  <option value="last15">Last 15 days</option>
                  {recentDates.map((d) => (
                    <option key={formatISO(d)} value={formatISO(d)}>
                      {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Right: Search & Stats */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col gap-6">
            <div className="relative w-full">
              <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input 
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition font-medium" 
                placeholder="Search articles and keywords..." 
                value={search} 
                onChange={(event) => setSearch(event.target.value)} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Trending Topic</div>
                <div className="text-lg font-black text-gray-900 flex items-center gap-2"><Flame size={18} className="text-warning" /> DeFi Yields</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Articles Found</div>
                <div className="text-lg font-black text-gray-900">{loading ? '...' : filteredNews.length}</div>
              </div>
            </div>
            
            <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-auto">
              <Clock size={12} /> Last updated: Just now
            </div>
          </div>
        </section>

        {/* News Grid */}
        <section>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-[380px] rounded-2xl" />)}
            </div>
          ) : filteredNews.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredNews.map((item) => <NewsCard key={item.id} item={item} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                <SearchX className="text-gray-400 size-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No News Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any news articles matching your criteria. Try adjusting your search or category filters.
              </p>
              <button onClick={() => { setSearch(''); setCategory('All'); setDateFilter('last15'); }} className="mt-6 px-6 py-2.5 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition shadow-sm">
                Clear Filters
              </button>
            </div>
          )}
        </section>

      </div>
    </PageShell>
  );
}
