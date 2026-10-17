import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User, InventoryTransaction, Item } from '../types';
import { 
  X, 
  Shield, 
  ShieldOff, 
  History, 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  Package
} from 'lucide-react';

interface UserManagementModalProps {
  user: User;
  items: Item[];
  onClose: () => void;
  onUpdate: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ user, items, onClose, onUpdate }) => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUserHistory = async () => {
      try {
        const history = await dbService.getUserTransactions(user.staff_id);
        setTransactions(history);
      } catch (error) {
        console.error("Failed to fetch user history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserHistory();
  }, [user.staff_id]);

  const handleToggleAccess = async () => {
    const newLevel = user.access_level === 'read_only' ? 'full_access' : 'read_only';
    setUpdating(true);
    try {
      await dbService.updateUserAccessLevel(user.firebase_uid, newLevel);
      onUpdate();
    } catch (error) {
      alert("Failed to update access level");
    } finally {
      setUpdating(false);
    }
  };

  const getItemName = (itemId: string | number) => {
    return items.find(i => i.id === itemId)?.name || 'Unknown Item';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-900/10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user.name}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  user.access_level === 'read_only' 
                    ? 'bg-amber-100 text-amber-600' 
                    : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {user.access_level === 'read_only' ? 'Read Only' : 'Full Access'}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-bold mt-1">Staff ID: <span className="font-mono text-indigo-600">{user.staff_id}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Actions */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Access Control</h3>
                <button 
                  onClick={handleToggleAccess}
                  disabled={updating}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                    user.access_level === 'read_only'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20'
                      : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-900/20'
                  }`}
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : user.access_level === 'read_only' ? (
                    <>
                      <Shield className="w-4 h-4" />
                      Grant Full Access
                    </>
                  ) : (
                    <>
                      <ShieldOff className="w-4 h-4" />
                      Revoke Edit Access
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-medium">
                  {user.access_level === 'read_only' 
                    ? "Granting full access allows this user to add items, edit stock, and process transactions."
                    : "Revoking edit access restricts this user to viewing data only. They will not be able to modify inventory."}
                </p>
              </div>

              <div className="p-6 bg-indigo-900/100 rounded-3xl border border-indigo-100">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Activity Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Total Actions</span>
                    <span className="text-sm font-black text-indigo-600">{transactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Last Active</span>
                    <span className="text-xs font-black text-slate-800">
                      {transactions.length > 0 
                        ? new Date(transactions[0].timestamp).toLocaleDateString() 
                        : 'No activity'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Personal Transaction History</h3>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/10 border-b border-slate-100">
                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center">
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-xs font-bold text-slate-400">
                            No transactions found for this user.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600">
                                  {new Date(t.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <Package className="w-3 h-3 text-indigo-400" />
                                <span className="text-[11px] font-black text-slate-800 truncate max-w-[150px]">
                                  {getItemName(t.item_id)}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                t.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {t.type === 'IN' ? <ArrowDownLeft className="w-2 h-2" /> : <ArrowUpRight className="w-2 h-2" />}
                                Stock {t.type}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-[11px] font-black text-slate-800">{t.quantity}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
