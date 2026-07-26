import { useState } from 'react';
import { Globe, Link as LinkIcon, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function CoinAbout({ coin }) {
  const [showFullDesc, setShowFullDesc] = useState(false);

  const externalLinks = [
    { label: 'Website', href: coin?.website, icon: <Globe size={14} /> },
    { label: 'Whitepaper', href: coin?.whitepaper || null, icon: <FileText size={14} /> },
    ...(Array.isArray(coin?.explorers) ? coin.explorers.slice(0, 3).map((url, index) => ({ label: `Explorer ${index + 1}`, href: url, icon: <LinkIcon size={14} /> })) : []),
  ].filter((link) => link.href);

  return (
    <div className="rounded-2xl bg-white p-6 border border-gray-200 shadow-sm flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">About {coin.name}</h2>
        {coin.description ? (
          <div className="text-sm leading-relaxed text-gray-600">
            <p className={showFullDesc ? '' : 'line-clamp-4'}>{coin.description}</p>
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="mt-2 text-primary font-bold flex items-center gap-1 hover:text-secondary transition">
              {showFullDesc ? 'Read Less' : 'Read More'} {showFullDesc ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">No description available for this asset.</p>
        )}
      </div>
      
      <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Official Links</h3>
          <div className="flex flex-wrap gap-2">
            {externalLinks.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition">
                {link.icon} {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Categories / Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {(Array.isArray(coin.categories) ? coin.categories : []).map(cat => (
              <span key={cat} className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white rounded border border-gray-200 shadow-sm">{cat}</span>
            ))}
            {(!coin.categories || coin.categories.length === 0) && <span className="text-xs text-gray-400 font-semibold">None</span>}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Blockchain Info</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <span className="text-xs font-bold text-gray-500">Algorithm</span>
              <span className="text-xs font-black text-gray-900">{coin.hashingAlgorithm || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <span className="text-xs font-bold text-gray-500">Launch Date</span>
              <span className="text-xs font-black text-gray-900">{coin.genesisDate || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
