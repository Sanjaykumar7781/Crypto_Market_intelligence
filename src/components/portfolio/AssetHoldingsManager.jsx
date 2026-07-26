import { useState, useMemo } from 'react';
import { Plus, Download, Trash2, ArrowRightLeft } from 'lucide-react';
import HoldingsSummary from './HoldingsSummary.jsx';
import HoldingsFilter from './HoldingsFilter.jsx';
import HoldingsTable from './HoldingsTable.jsx';
import AddAssetModal from './AddAssetModal.jsx';
import HoldingDrawer from './HoldingDrawer.jsx';

export default function AssetHoldingsManager({ 
  holdingsWithPrice, 
  handleRemoveHolding, 
  loading,
  totals,
  form,
  handleFormChange,
  handleAddHolding
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('All'); // 'All', 'Profit', 'Loss'
  const [sortField, setSortField] = useState('currentVal');
  const [sortDir, setSortDir] = useState('desc');
  
  const [selectedRows, setSelectedRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drawerHolding, setDrawerHolding] = useState(null);

  // Apply Filter and Search
  const filteredHoldings = useMemo(() => {
    return holdingsWithPrice.filter(h => {
      // Search
      const matchSearch = (h.symbol?.toLowerCase().includes(searchQuery.toLowerCase())) || 
                          (h.coinId?.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchSearch) return false;
      
      // Profit/Loss Filter
      const currentVal = (Number(h.currentPrice) || 0) * (Number(h.amount) || 0);
      const costBasis = (Number(h.averageBuyPrice) || 0) * (Number(h.amount) || 0);
      const pl = currentVal - costBasis;
      
      if (filterMode === 'Profit' && pl < 0) return false;
      if (filterMode === 'Loss' && pl >= 0) return false;
      
      return true;
    });
  }, [holdingsWithPrice, searchQuery, filterMode]);

  // Apply Sort
  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      let valA = 0; let valB = 0;
      
      const valA_total = (Number(a.currentPrice) || 0) * (Number(a.amount) || 0);
      const valB_total = (Number(b.currentPrice) || 0) * (Number(b.amount) || 0);
      
      const costA = (Number(a.averageBuyPrice) || 0) * (Number(a.amount) || 0);
      const costB = (Number(b.averageBuyPrice) || 0) * (Number(b.amount) || 0);

      switch(sortField) {
        case 'currentVal': valA = valA_total; valB = valB_total; break;
        case 'pl': valA = valA_total - costA; valB = valB_total - costB; break;
        case 'roi': valA = costA ? (valA_total - costA)/costA : 0; valB = costB ? (valB_total - costB)/costB : 0; break;
        case 'change24h': valA = a.change24h || 0; valB = b.change24h || 0; break;
        case 'amount': valA = a.amount; valB = b.amount; break;
        default: valA = valA_total; valB = valB_total;
      }
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredHoldings, sortField, sortDir]);

  const bulkDelete = () => {
    // In a real scenario, API would handle bulk delete.
    // For now, sequentially remove or just UI feedback.
    selectedRows.forEach(id => handleRemoveHolding(id));
    setSelectedRows([]);
  };

  return (
    <div className="flex flex-col gap-2">
      
      {/* Top action bar & Summary */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Asset Holdings</h2>
            <p className="text-xs font-bold text-gray-500 mt-1">Manage and analyze your crypto portfolio</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 mr-2">
                <span className="text-xs font-bold text-gray-600 px-2">{selectedRows.length} selected</span>
                <button onClick={bulkDelete} className="p-1.5 bg-white border border-gray-200 text-rose-500 hover:bg-rose-50 rounded-lg shadow-sm transition">
                  <Trash2 size={14} />
                </button>
                <button className="p-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg shadow-sm transition">
                  <ArrowRightLeft size={14} />
                </button>
              </div>
            )}
            <button className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl shadow-sm transition" title="Export CSV">
              <Download size={18} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider shadow-sm transition"
            >
              <Plus size={16} /> Add Asset
            </button>
          </div>
        </div>

        <HoldingsSummary 
          holdingsWithPrice={holdingsWithPrice} 
          totalValue={totals.totalValue} 
          totalCost={totals.totalCost}
          profitLoss={totals.profitLoss}
          profitPct={totals.profitPct}
        />
        
        <HoldingsFilter 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          sortField={sortField}
          setSortField={setSortField}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />

        <HoldingsTable 
          holdingsWithPrice={sortedHoldings} 
          handleRemoveHolding={handleRemoveHolding} 
          loading={loading}
          totalValue={totals.totalValue}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          onRowClick={setDrawerHolding}
        />
      </div>

      <AddAssetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        handleFormChange={handleFormChange}
        handleAddHolding={(e) => {
          handleAddHolding(e);
          setIsModalOpen(false); // Close on submit
        }}
        loading={loading}
      />

      <HoldingDrawer 
        isOpen={!!drawerHolding}
        onClose={() => setDrawerHolding(null)}
        holding={drawerHolding}
        totalValue={totals.totalValue}
      />
    </div>
  );
}
