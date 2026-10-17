import React, { useState, useMemo, useEffect } from 'react';
import { Item, Category, User } from '../types';
import { Plus, Search, Tag, AlertTriangle, Package, FolderPlus, Filter, ArrowUpDown, ChevronDown, Edit2, Download, Lock } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

interface InventoryManagerProps {
  items: Item[];
  categories: Category[];
  onAddItem: (item: any) => void;
  onUpdateItem: (id: number | string, item: any) => void;
  onAddCategory: (name: string, prefix: string) => void;
  onQuickTransaction: (item: Item) => void;
  initialStatusFilter?: StatusFilter;
  dbUser: User | null;
}

type SortOption = 'name-asc' | 'stock-asc' | 'stock-desc' | 'category-asc' | 'sku-asc';
type StatusFilter = 'All' | 'Healthy' | 'Restock';

const InventoryManager: React.FC<InventoryManagerProps> = ({ items, categories, onAddItem, onUpdateItem, onAddCategory, onQuickTransaction, initialStatusFilter, dbUser }) => {
  const isReadOnly = dbUser?.access_level === 'read_only';
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', prefix: '' });
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatusFilter || 'All');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    reorder_point: 5,
    is_hot: false,
  });

  // Auto-generate SKU when category changes (only for new items)
  useEffect(() => {
    if (formData.category && !editingItem) {
      const categoryObj = categories.find(c => c.name === formData.category);
      const prefix = categoryObj?.prefix || 'ITEM';
      const countInCategory = items.filter(i => i.category === formData.category).length;
      const nextNum = (countInCategory + 1).toString().padStart(3, '0');
      setFormData(prev => ({ ...prev, sku: `${prefix}-${nextNum}` }));
    } else if (!editingItem) {
      setFormData(prev => ({ ...prev, sku: '' }));
    }
  }, [formData.category, items, editingItem, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return alert("Please select a category");
    
    if (editingItem) {
      onUpdateItem(editingItem.id, {
        name: formData.name,
        category: formData.category,
        reorder_point: formData.reorder_point,
        is_hot: formData.is_hot
      });
    } else {
      onAddItem(formData);
    }
    
    setFormData({ sku: '', name: '', category: '', reorder_point: 5, is_hot: false });
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      category: item.category,
      reorder_point: item.reorder_point,
      is_hot: item.is_hot
    });
    setShowForm(true);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.name.trim() && newCategory.prefix.trim()) {
      onAddCategory(newCategory.name.trim(), newCategory.prefix.trim().toUpperCase());
      setNewCategory({ name: '', prefix: '' });
      setShowCategoryModal(false);
    }
  };

  const processedItems = useMemo(() => {
    let result = items.filter(i => {
      const matchesSearch = (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = (categoryFilter === 'All' || i.category === categoryFilter);
      
      const isLow = i.current_stock <= i.reorder_point;
      const matchesStatus = statusFilter === 'All' || 
                           (statusFilter === 'Restock' && isLow) || 
                           (statusFilter === 'Healthy' && !isLow);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'stock-asc') return a.current_stock - b.current_stock;
      if (sortBy === 'stock-desc') return b.current_stock - a.current_stock;
      if (sortBy === 'category-asc') return a.category.localeCompare(b.category);
      if (sortBy === 'sku-asc') return a.sku.localeCompare(b.sku);
      return 0;
    });

    return result;
  }, [items, search, categoryFilter, statusFilter, sortBy]);

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    const exportData = processedItems.map(item => ({
      SKU: item.sku,
      Name: item.name,
      Category: item.category,
      'Current Stock': item.current_stock,
      'Reorder Point': item.reorder_point,
      'Is Hot': item.is_hot ? 'Yes' : 'No'
    }));
    exportToCSV(exportData, `inventory_stock_${date}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Advanced Filters Toolbar */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search master inventory..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-900/30 border border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          {/* Status Filter Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            {(['All', 'Restock', 'Healthy'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === status 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/20 border border-slate-800 rounded-2xl min-w-[180px]">
            <Tag className="w-4 h-4 text-slate-500" />
            <select 
              className="bg-transparent border-none p-0 text-xs font-black text-slate-400 focus:ring-0 cursor-pointer w-full uppercase tracking-widest"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Clusters</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 text-slate-300 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 text-indigo-400" />
              Sort Options
              <ChevronDown className={`w-3 h-3 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showSortDropdown && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {[
                  { id: 'name-asc', label: 'Name (A-Z)' },
                  { id: 'stock-asc', label: 'Stock: Low to High' },
                  { id: 'stock-desc', label: 'Stock: High to Low' },
                  { id: 'category-asc', label: 'Category' },
                  { id: 'sku-asc', label: 'SKU' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortBy(opt.id as SortOption); setShowSortDropdown(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${sortBy === opt.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors border border-slate-200"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
            <button
              onClick={() => !isReadOnly && setShowCategoryModal(true)}
              disabled={isReadOnly}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors border ${
                isReadOnly 
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 border-slate-700'
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              + Category
            </button>
            <button
              onClick={() => !isReadOnly && setShowForm(!showForm)}
              disabled={isReadOnly}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                isReadOnly
                  ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/30'
              }`}
            >
              {isReadOnly ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              Create Item
            </button>
        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-indigo-500/10 rounded-3xl">
                <FolderPlus className="w-12 h-12 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Category</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">Define a new segment and its unique SKU prefix.</p>
              </div>
              <form onSubmit={handleCreateCategory} className="w-full space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left ml-1">Category Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. Monitors"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left ml-1">SKU Prefix</label>
                    <input 
                      required
                      type="text"
                      maxLength={10}
                      placeholder="e.g. MON"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-black uppercase focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      value={newCategory.prefix}
                      onChange={(e) => setNewCategory({ ...newCategory, prefix: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowCategoryModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/30"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingItem ? 'Update Inventory Asset' : 'Register New Inventory'}
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                {editingItem ? `Editing SKU: ${editingItem.sku}` : 'Master Data Entry'}
              </p>
            </div>
            <button 
              onClick={() => { setShowForm(false); setEditingItem(null); }} 
              className="text-slate-400 hover:text-red-500 transition-colors text-sm font-black uppercase tracking-widest bg-slate-100 p-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Segment</label>
              <select
                required
                className="w-full p-4 bg-slate-900/20 border border-slate-800 rounded-2xl text-sm font-bold"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Asset SKU</label>
              <div className="w-full p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-sm font-mono font-black text-indigo-400">
                {formData.sku || '---'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Descriptor</label>
              <input
                required
                placeholder="Product Name"
                className="w-full p-4 bg-slate-900/20 border border-slate-800 rounded-2xl text-sm font-bold"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Threshold</label>
              <input
                required
                type="number"
                min="0"
                className="w-full p-4 bg-slate-900/20 border border-slate-800 rounded-2xl text-sm font-black"
                value={formData.reorder_point}
                onChange={e => setFormData({ ...formData, reorder_point: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <input
                type="checkbox"
                id="is_hot"
                className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
                checked={formData.is_hot}
                onChange={e => setFormData({ ...formData, is_hot: e.target.checked })}
              />
              <label htmlFor="is_hot" className="text-xs font-black text-amber-500 uppercase tracking-widest cursor-pointer select-none">
                Mark as Hot Item 🔥
              </label>
            </div>
            
            <div className="lg:col-span-4 flex justify-end gap-4 mt-4 pt-8 border-t border-slate-100">
              <button 
                type="submit"
                disabled={!formData.sku}
                className="px-12 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/30 disabled:opacity-30 active:scale-95"
              >
                {editingItem ? 'Update Asset Record' : 'Sync with Master Database'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/10">
                <th className="px-8 py-6">Asset Specification</th>
                <th className="px-8 py-6">Segment</th>
                <th className="px-8 py-6 text-center">Global Stock</th>
                <th className="px-8 py-6 text-center">Threshold</th>
                <th className="px-8 py-6">Audit Status</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedItems.map(item => {
                const qty = item.current_stock;
                const isLow = qty <= item.reorder_point;

                return (
                  <tr key={item.id} className="hover:bg-slate-900/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 text-base group-hover:text-indigo-400 transition-colors">{item.name}</p>
                        {item.is_hot && <span className="text-lg animate-bounce" title="Hot Item">🔥</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tight mt-0.5">{item.sku}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/20 text-slate-400 text-[10px] font-black rounded-xl uppercase tracking-widest border border-slate-800">
                        <Tag className="w-3 h-3 text-indigo-400" />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`text-xl font-black ${isLow ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'text-slate-800'}`}>
                        {qty}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-xs font-black text-slate-400 bg-slate-900/20 px-3 py-1.5 rounded-xl border border-slate-800">{item.reorder_point}</span>
                    </td>
                    <td className="px-8 py-6">
                      {isLow ? (
                        <div className="badge-restock inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] animate-pulse">
                          <AlertTriangle className="w-4 h-4" />
                          RESTOCK
                        </div>
                      ) : (
                        <div className="badge-healthy inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px]">
                          <Package className="w-4 h-4" />
                          HEALTHY
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-center gap-2">
                        {!isReadOnly && (
                          <>
                            <button 
                              onClick={() => onQuickTransaction(item)}
                              className="px-3 py-1.5 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all hover:text-white"
                              title="Quick Transaction"
                            >
                              Stock In/Out
                            </button>
                            <button 
                              onClick={() => handleEditClick(item)}
                              className="p-2 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 rounded-xl transition-all"
                              title="Edit Item"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isReadOnly && (
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Read Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {processedItems.length === 0 && (
          <div className="p-32 text-center bg-slate-900/5">
            <div className="w-20 h-20 bg-slate-900/40 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-800">
              <Search className="w-10 h-10 text-slate-600" />
            </div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">No match found</h4>
            <p className="text-slate-500 text-sm mt-2 font-bold uppercase tracking-widest">Adjust your search parameters or segment filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManager;