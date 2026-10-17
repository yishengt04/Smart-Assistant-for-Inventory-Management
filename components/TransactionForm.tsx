
import React, { useState, useEffect, useMemo } from 'react';
import { Item, TransactionType, Category } from '../types';
import { ArrowDownLeft, ArrowUpRight, Save, ClipboardList } from 'lucide-react';

interface TransactionFormProps {
  items: Item[];
  categories: Category[];
  onTransaction: (data: any) => void;
  preSelectedItem?: Item | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ items, categories, onTransaction, preSelectedItem }) => {
  const [selectedCategory, setSelectedCategory] = useState(preSelectedItem?.category || '');
  const [formData, setFormData] = useState({
    item_id: preSelectedItem?.id.toString() || '',
    type: 'IN' as TransactionType,
    quantity: 1,
    ref_no: '',
    remarks: '',
  });

  // Filter items based on the selected category
  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    return items.filter(i => i.category === selectedCategory);
  }, [items, selectedCategory]);

  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      ref_no: `TX-${Date.now().toString().slice(-6)}`
    }));
  }, []);

  // Reset item selection if category changes (unless it's the pre-selected one)
  useEffect(() => {
    if (preSelectedItem && selectedCategory === preSelectedItem.category && formData.item_id === '') {
       setFormData(prev => ({ ...prev, item_id: preSelectedItem.id.toString() }));
    } else if (!preSelectedItem || selectedCategory !== preSelectedItem.category) {
       setFormData(prev => ({ ...prev, item_id: '' }));
    }
  }, [selectedCategory, preSelectedItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id) return alert("Select an item first");
    
    onTransaction({
      ...formData,
      item_id: parseInt(formData.item_id)
    });

    setFormData({
      item_id: '',
      type: 'IN',
      quantity: 1,
      ref_no: `TX-${Date.now().toString().slice(-6)}`,
      remarks: '',
    });
    setSelectedCategory('');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Record Team Transaction</h3>
          <p className="text-sm text-slate-500">Log stock movements for the whole team</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-slate-600">Transaction Direction</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'IN' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                  formData.type === 'IN' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/20' 
                  : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5" />
                <span className="font-bold">Stock In</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'OUT' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                  formData.type === 'OUT' 
                  ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20' 
                  : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                <span className="font-bold">Stock Out</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">Step 1: Select Category</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Choose Category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">Step 2: Select Item</label>
            <select
              disabled={!selectedCategory}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
              value={formData.item_id}
              onChange={e => setFormData({ ...formData, item_id: e.target.value })}
            >
              <option value="">{selectedCategory ? 'Choose Item...' : 'Select Category first'}</option>
              {filteredItems.map(item => (
                <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
              ))}
            </select>
            {formData.item_id && (
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 animate-in fade-in slide-in-from-top-1">
                Current Stock available: {items.find(i => i.id.toString() === formData.item_id.toString())?.current_stock || 0}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">Quantity</label>
            <input
              type="number"
              min="1"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">Reference No.</label>
            <input
              type="text"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              value={formData.ref_no}
              onChange={e => setFormData({ ...formData, ref_no: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-600">Remarks / Team Notes</label>
          <textarea
            rows={3}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            placeholder="Why is this stock being moved?"
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/50"
        >
          <Save className="w-6 h-6" />
          Post Transaction
        </button>
      </form>
    </div>
  );
};

// Fix: Adding the missing default export to fix the error in App.tsx
export default TransactionForm;
