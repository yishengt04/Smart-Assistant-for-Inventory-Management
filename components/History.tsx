
import React from 'react';
import { InventoryTransaction, Item } from '../types';
import { FileText, ArrowDownLeft, ArrowUpRight, User, Download } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

interface HistoryProps {
  transactions: InventoryTransaction[];
  items: Item[];
}

const History: React.FC<HistoryProps> = ({ transactions, items }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  
  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    const exportData = transactions.map(tx => {
      const item = items.find(i => i.id === tx.item_id);
      return {
        Date: new Date(tx.timestamp).toLocaleString(),
        User: tx.staff_name || tx.user_email,
        'Staff ID': tx.staff_id || 'N/A',
        'Item Name': item?.name || 'Deleted Item',
        'Item SKU': item?.sku || 'N/A',
        Type: tx.type,
        Quantity: tx.quantity,
        'Ref No': tx.ref_no,
        Remarks: tx.remarks
      };
    });
    exportToCSV(exportData, `transaction_history_${date}.csv`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Team Activity Trail</h3>
        <button 
          onClick={handleExport}
          className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Export History
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Qty</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(tx => {
              const item = items.find(i => i.id === tx.item_id);
              const isOut = tx.type === 'OUT';

              return (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-xs font-bold text-slate-800">
                      {formatTimestamp(tx.timestamp)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-slate-100 rounded text-slate-500">
                        <User className="w-3 h-3" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 truncate max-w-[120px]">
                          {tx.staff_name || tx.user_email.split('@')[0]}
                        </p>
                        {tx.staff_id && (
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tx.staff_id}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-700">{item?.name || 'Deleted Item'}</p>
                    <p className="text-[10px] text-slate-400 uppercase">{item?.sku}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      isOut ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isOut ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-mono font-bold text-slate-800">{tx.quantity}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-600 uppercase">{tx.ref_no}</p>
                    <p className="text-[10px] text-slate-400 italic truncate max-w-[150px]">{tx.remarks}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {transactions.length === 0 && (
        <div className="p-12 text-center text-slate-400">
          <p>The team hasn't logged any movements yet.</p>
        </div>
      )}
    </div>
  );
};

export default History;
