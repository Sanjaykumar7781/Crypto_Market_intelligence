import { Search, Filter, ArrowUpDown } from 'lucide-react';

export default function HoldingsFilter({ 
  searchQuery, 
  setSearchQuery, 
  filterMode, 
  setFilterMode,
  sortField,
  setSortField,
  sortDir,
  setSortDir
}) {
  
  const handleSort = (e) => {
    const val = e.target.value;
    if (val === sortField) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(val);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-2.5 text-gray-400 size-4" />
        <input 
          type="text"
          placeholder="Search by coin name or symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-gray-200 text-sm font-bold text-gray-900 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl shadow-sm">
          {['All', 'Profit', 'Loss'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${filterMode === mode ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative">
          <select 
            value={sortField}
            onChange={handleSort}
            className="appearance-none bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl pl-4 pr-10 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition cursor-pointer"
          >
            <option value="currentVal">Sort by Value</option>
            <option value="roi">Sort by ROI</option>
            <option value="pl">Sort by Profit</option>
            <option value="change24h">Sort by 24H Change</option>
            <option value="amount">Sort by Quantity</option>
          </select>
          <ArrowUpDown className="absolute right-3 top-3 text-gray-400 size-4 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
