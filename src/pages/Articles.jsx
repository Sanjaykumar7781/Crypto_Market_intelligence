import { Link } from 'react-router-dom';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, UserRound, Bookmark, Share2, Search, SlidersHorizontal, BookOpen, Check, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell.jsx';
import { articles } from '../data/articles.js';

const ALL_CATEGORIES = [
  'All', 'Research', 'Market Analysis', 'Blockchain', 'Bitcoin', 
  'Ethereum', 'Altcoins', 'Trading', 'Regulation', 'AI', 
  'Education', 'Security', 'DeFi', 'NFT', 'Layer 2'
];

const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'viewed', label: 'Most Viewed' },
  { id: 'rated', label: 'Highest Rated' },
  { id: 'trending', label: 'Trending' },
  { id: 'time_short', label: 'Reading Time (Shortest)' },
  { id: 'time_long', label: 'Reading Time (Longest)' },
  { id: 'az', label: 'A-Z' },
  { id: 'za', label: 'Z-A' },
];

export default function Articles() {
  const [category, setCategory] = useState(() => localStorage.getItem('article_category') || 'All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  
  const sortRef = useRef(null);
  const chipsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('article_category', category);
  }, [category]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category Counts
  const categoryCounts = useMemo(() => {
    const counts = { 'All': articles.length };
    articles.forEach(article => {
      (article.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, []);

  const filteredArticles = useMemo(() => {
    let result = articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) || 
                            article.excerpt.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || (article.tags || []).includes(category);
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      switch (sortBy) {
        case 'latest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'popular': return (b.popularityScore || 0) - (a.popularityScore || 0);
        case 'viewed': return (b.views || 0) - (a.views || 0);
        case 'rated': return (b.rating || 0) - (a.rating || 0);
        case 'trending': return (b.popularityScore || 0) * (b.views || 0) - (a.popularityScore || 0) * (a.views || 0);
        case 'time_short': return (a.readingTimeMinutes || 5) - (b.readingTimeMinutes || 5);
        case 'time_long': return (b.readingTimeMinutes || 5) - (a.readingTimeMinutes || 5);
        case 'az': return a.title.localeCompare(b.title);
        case 'za': return b.title.localeCompare(a.title);
        default: return dateB - dateA;
      }
    });

    return result;
  }, [category, search, sortBy]);

  const activeSortLabel = SORT_OPTIONS.find(opt => opt.id === sortBy)?.label || 'Sort';

  const handleCategoryClick = (cat, index) => {
    setCategory(cat);
    if (chipsRef.current) {
      const chip = chipsRef.current.children[index];
      if (chip) {
        chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        
        {/* Top Header Section */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs mb-2">
                <BookOpen size={16} /> Insight & Analysis
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Research Articles</h1>
              <p className="text-gray-500 mt-2 text-sm max-w-2xl">
                Deep-dive research, market analysis, and educational content from our expert analysts and community contributors.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition text-sm font-medium"
                />
              </div>
              <div className="relative" ref={sortRef}>
                <button 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center justify-between gap-2 h-10 bg-white border border-gray-200 text-gray-700 px-4 rounded-xl text-sm font-semibold hover:bg-gray-50 transition min-w-[140px] shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-gray-400" />
                    <span>{activeSortLabel}</span>
                  </div>
                </button>
                
                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition ${
                          sortBy === option.id 
                            ? 'bg-primary/5 text-primary font-bold' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                        {sortBy === option.id && <Check size={14} className="text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100 pt-5">
            <div 
              ref={chipsRef}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1"
            >
              {ALL_CATEGORIES.map((cat, index) => {
                const count = categoryCounts[cat] || 0;
                // Only show categories that have articles, except 'All'
                if (cat !== 'All' && count === 0) return null;
                
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat, index)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 ${
                      category === cat 
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      category === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className="text-xs font-bold text-gray-500 whitespace-nowrap bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 self-start sm:self-auto">
              Showing {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''}
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section>
          {filteredArticles.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <Link 
                  key={article.slug} 
                  to={`/articles/${article.slug}`} 
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col h-full hover:-translate-y-1"
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <img 
                      src={article.image || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-white/95 backdrop-blur border border-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm uppercase tracking-wider">
                        {article.tags?.[0] || 'Article'}
                      </span>
                    </div>
                    {article.source && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-gray-900/70 backdrop-blur text-white px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide flex items-center gap-1.5">
                          <Newspaper size={12} /> {article.source}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug line-clamp-2">{article.title}</h2>
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3 leading-relaxed flex-1">{article.excerpt}</p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserRound size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{article.author || 'Analyst Team'}</p>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            {new Date(article.date || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • <Clock size={10} /> {article.readingTime || '5 min'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-gray-400">
                        <button className="p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Bookmark size={16} />
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                <BookOpen className="text-gray-400 size-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No Articles Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We couldn't find any articles matching your search or category filter. Try adjusting your search criteria.
              </p>
              <button 
                onClick={() => { setSearch(''); setCategory('All'); }} 
                className="mt-6 px-6 py-2.5 bg-primary hover:bg-secondary text-white font-bold rounded-xl transition shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
