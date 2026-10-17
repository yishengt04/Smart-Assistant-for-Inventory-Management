import React, { useState, useMemo } from 'react';
import { Item, InventoryStock } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie } from 'recharts';
import { AlertCircle, TrendingUp, Package, Sparkles, Loader2, Play, PieChart as PieIcon, Circle, ArrowUp, ArrowDown, X } from 'lucide-react';
import { getInventoryInsights } from '../services/geminiService';
import InventoryPieChart from './InventoryPieChart';

interface DashboardProps {
  items: Item[];
  stocks: InventoryStock[];
  onViewItems: () => void;
  onViewLowStock: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, stocks, onViewItems, onViewLowStock }) => {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [chartFilter, setChartFilter] = useState<'all' | 'low' | 'high'>('all');
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const lowStockItems = items.filter(item => item.current_stock <= item.reorder_point);

  // Category distribution data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [items]);

  const top5HighStock = useMemo(() => {
    return [...items].sort((a, b) => b.current_stock - a.current_stock).slice(0, 5);
  }, [items]);

  const top5LowStock = useMemo(() => {
    return [...items].sort((a, b) => a.current_stock - b.current_stock).slice(0, 5);
  }, [items]);

  const filteredItemsForChart = useMemo(() => {
    let base = items;
    if (chartFilter === 'low') {
      base = items.filter(item => item.current_stock <= item.reorder_point);
    } else if (chartFilter === 'high') {
      base = items.filter(item => item.current_stock > item.reorder_point);
    }
    return base.slice(0, 15); // Show top 15 for readability
  }, [items, chartFilter]);

  const chartData = filteredItemsForChart.map(item => ({
    name: item.name,
    quantity: item.current_stock,
    reorder: item.reorder_point
  }));

  const fetchInsights = async () => {
    setLoadingAi(true);
    try {
      const stockPayload = items.map(i => ({ 
        item_id: i.id, 
        current_quantity: i.current_stock, 
        last_updated: new Date().toISOString() 
      }));
      const insights = await getInventoryInsights(items, stockPayload);
      setAiInsights(insights || 'No insights available.');
    } catch (error) {
      setAiInsights('Error generating insights. Please try again later.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={onViewItems}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover:bg-indigo-500/20 transition-colors">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total SKU's</p>
              <p className="text-3xl font-black text-slate-800">{items.length}</p>
            </div>
          </div>
        </div>
        <div 
          onClick={() => setShowLowStockModal(true)}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl group-hover:bg-red-500/20 transition-colors">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Low Stock Alert</p>
              <p className="text-3xl font-black text-slate-800">{lowStockItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Inventory</p>
              <p className="text-3xl font-black text-slate-800">
                {items.reduce((acc, i) => acc + i.current_stock, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Stock Level Analysis
            </h3>
            
            {/* Clickable Dots for Filtering */}
            <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
              <button 
                onClick={() => setChartFilter('all')}
                className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg transition-all ${chartFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
              >
                All
              </button>
              <button 
                onClick={() => setChartFilter('low')}
                className={`flex items-center gap-2 text-[10px] font-black uppercase px-2 py-1 rounded-lg transition-all ${chartFilter === 'low' ? 'bg-red-500/20 text-red-500 shadow-sm' : 'text-slate-500'}`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                Low Stock
              </button>
              <button 
                onClick={() => setChartFilter('high')}
                className={`flex items-center gap-2 text-[10px] font-black uppercase px-2 py-1 rounded-lg transition-all ${chartFilter === 'high' ? 'bg-indigo-500/20 text-indigo-500 shadow-sm' : 'text-slate-500'}`}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                High Stock
              </button>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" fontSize={10} interval={0} tick={{ fill: '#94a3b8' }} />
                <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Bar dataKey="quantity" name="Current Stock" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.quantity <= entry.reorder ? '#ef4444' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-emerald-500" />
            Inventory Health
          </h3>
          <InventoryPieChart items={items} />
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            Category Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High/Low Stock Lists */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-emerald-500" />
              Top 5 Highest Stock
            </h3>
            <div className="space-y-3">
              {top5HighStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                  </div>
                  <span className="text-sm font-black text-emerald-600">{item.current_stock}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-red-500" />
              Top 5 Lowest Stock
            </h3>
            <div className="space-y-3">
              {top5LowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                  </div>
                  <span className="text-sm font-black text-red-600">{item.current_stock}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500 drop-shadow-sm" />
              <h3 className="text-lg font-bold text-slate-800">Supply Chain Logic Analyst</h3>
            </div>
            {aiInsights && !loadingAi && (
              <button 
                onClick={fetchInsights}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
              >
                Refresh Analysis
              </button>
            )}
          </div>
          
          <div className="bg-slate-900/50 rounded-2xl p-8 flex-1 overflow-auto max-h-[400px] border border-slate-800 flex flex-col items-start justify-start min-h-[200px]">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center gap-6 text-slate-400 w-full py-12">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                <div className="text-center">
                  <p className="text-base font-bold text-white mb-1 animate-pulse">Gemini is analyzing inventory trends...</p>
                  <p className="text-xs text-slate-500">Calculating reorder points and predicting demand spikes.</p>
                </div>
              </div>
            ) : aiInsights ? (
              <div className={`prose prose-sm prose-invert max-w-none whitespace-pre-line leading-relaxed w-full font-medium ${
                aiInsights.startsWith('Error:') ? 'text-red-400' : 'text-slate-300'
              }`}>
                {aiInsights}
              </div>
            ) : (
              <div className="text-center space-y-6 w-full py-12">
                <div className="relative inline-block">
                  <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl inline-flex relative z-10">
                    <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white tracking-tight">AI Supply Chain Diagnostic</h4>
                  <p className="text-sm text-slate-400 max-w-[400px] mx-auto mt-2 font-medium">Get real-time insights on your inventory health, identifying bottleneck items and critical reorder needs using Google Gemini.</p>
                </div>
                <button 
                  onClick={fetchInsights}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-base font-black flex items-center gap-3 mx-auto hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Generate AI Audit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Detailed Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 text-red-600 rounded-2xl">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Critical Stock Audit</h3>
                  <p className="text-xs text-red-600 font-black uppercase tracking-widest mt-1">Action Required Immediately</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLowStockModal(false)}
                className="p-3 hover:bg-red-100 rounded-2xl text-slate-400 hover:text-red-600 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {lowStockItems.length > 0 ? (
                <div className="space-y-4">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-red-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                          {item.sku.split('-')[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold">{item.sku} • {item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-red-600">{item.current_stock}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase">Threshold: {item.reorder_point}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800">All Systems Nominal</h4>
                  <p className="text-sm text-slate-500 mt-1">No items are currently below reorder thresholds.</p>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => { setShowLowStockModal(false); onViewLowStock(); }}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/20"
              >
                Go to Item List
              </button>
              <button 
                onClick={() => setShowLowStockModal(false)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;