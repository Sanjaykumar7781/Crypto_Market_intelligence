import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Clock, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '../components/PageShell.jsx';
import { articles } from '../data/articles.js';

export default function Articles() {
  const [dateFilter, setDateFilter] = useState('last15');

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

  const filteredArticles = useMemo(() => {
    if (dateFilter === 'last15') {
      const since = new Date();
      since.setDate(since.getDate() - 15);
      return articles.filter((a) => new Date(a.date).getTime() >= since.getTime());
    }
    return articles.filter((a) => new Date(a.date).toISOString().slice(0, 10) === dateFilter);
  }, [dateFilter]);

  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-premium p-6 rounded-2xl border border-white/8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyanGlow/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyanGlow">Research desk</p>
          <h1 className="mt-3 text-4xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Recent Articles</h1>
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

        <div className="mt-8 grid gap-5 lg:grid-cols-3 relative z-10">
          {filteredArticles.map((article) => (
            <Link 
              key={article.slug} 
              to={`/articles/${article.slug}`} 
              className="glass-premium rounded-2xl p-5 border border-white/8 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-cyanGlow/30 hover:shadow-[0_12px_24px_rgba(40,215,255,0.1)] flex flex-col justify-between group"
            >
              <div>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="rounded-lg bg-cyanGlow/10 border border-cyanGlow/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyanGlow"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="mt-4 text-lg font-black text-white group-hover:text-cyanGlow transition-colors leading-snug">{article.title}</h2>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-400 line-clamp-4">{article.excerpt}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><UserRound size={13} className="text-cyanGlow" /> {article.author}</span>
                <span className="flex items-center gap-1.5"><Clock size={13} className="text-cyanGlow" /> {article.readingTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </PageShell>
  );
}
