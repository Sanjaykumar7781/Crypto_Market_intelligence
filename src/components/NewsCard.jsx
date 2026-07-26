import { ExternalLink, Calendar, Tag } from 'lucide-react';
import { date } from '../utils/format.js';

export default function NewsCard({ item }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary flex flex-col justify-between group overflow-hidden">
      <div>
        <div className="relative h-48 w-full bg-gray-50 overflow-hidden">
          <img 
            src={item.image} 
            alt="" 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          {item.category && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur text-gray-900 border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm">
              <Tag size={9} /> {item.category}
            </span>
          )}
        </div>
        
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-3">
            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-primary" /> {date(item.publishedAt)}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-bold text-gray-900 group-hover:text-primary transition-colors duration-200 leading-snug">{item.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{item.description}</p>
        </div>
      </div>

      <div className="p-6 pt-4 mt-auto">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary transition duration-200"
        >
          Read Full Story <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}
