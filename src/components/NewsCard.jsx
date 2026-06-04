import { ExternalLink, Calendar, Tag } from 'lucide-react';
import { date } from '../utils/format.js';

export default function NewsCard({ item }) {
  return (
    <article className="glass-premium overflow-hidden rounded-2xl border border-white/8 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-cyanGlow/30 hover:shadow-[0_12px_30px_rgba(40,215,255,0.15)] flex flex-col justify-between group">
      <div>
        <div className="overflow-hidden relative h-48 w-full bg-white/5">
          <img 
            src={item.image} 
            alt="" 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          {item.category && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-cyanGlow text-slate-950 px-2.5 py-1 rounded-lg shadow-lg">
              <Tag size={9} /> {item.category}
            </span>
          )}
        </div>
        
        <div className="p-5">
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
            <span className="flex items-center gap-1"><Calendar size={11} className="text-cyanGlow" /> {date(item.publishedAt)}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-extrabold text-white group-hover:text-cyanGlow transition-colors duration-200 leading-snug">{item.title}</h3>
          <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-slate-400">{item.description}</p>
        </div>
      </div>

      <div className="p-5 pt-0">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noreferrer" 
          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-mint hover:text-white transition duration-200"
        >
          Read Full Story <ExternalLink size={12} />
        </a>
      </div>
    </article>
  );
}
