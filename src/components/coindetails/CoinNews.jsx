import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync.js';
import { api } from '../../services/api.js';

export default function CoinNews({ coin }) {
  // Try to search news related to the coin symbol, fallback to general crypto
  const { data: news = [], loading } = useAsync(() => api.news(coin.symbol || 'crypto', ''), [coin.symbol]);

  const displayedNews = Array.isArray(news) ? news.slice(0, 4) : [];

  if (loading || displayedNews.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm mt-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="text-gray-900 size-5" />
          <h2 className="text-xl font-bold text-gray-900">{coin.name} News</h2>
        </div>
        <Link to="/news" className="text-sm font-bold text-primary hover:text-secondary transition">View All</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedNews.map((article) => (
          <a
            key={article.id || article.url}
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="h-32 overflow-hidden relative">
              <img 
                src={article.image || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded">
                {article.source?.name || 'News'}
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-[11px] font-semibold text-gray-500 mt-auto pt-3">
                {new Date(article.publishedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
