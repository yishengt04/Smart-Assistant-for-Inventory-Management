import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User, Item } from '../types';
import UserManagementModal from './UserManagementModal';
import { 
  Users, 
  ShieldAlert, 
  Trash2, 
  UserX, 
  UserCheck, 
  Loader2, 
  Search,
  LogOut,
  RefreshCw,
  Settings2
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allUsers, allItems] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getInventory()
      ]);
      setUsers(allUsers);
      setItems(allItems);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    setActionLoading(user.firebase_uid);
    try {
      await dbService.updateUserStatus(user.firebase_uid, newStatus);
      await fetchData();
    } catch (error) {
      alert("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This will remove them from the database, but they can still log in via Firebase (and will be treated as a new user).`)) {
      return;
    }
    
    setActionLoading(user.firebase_uid);
    try {
      await dbService.deleteUser(user.firebase_uid);
      await fetchData();
    } catch (error) {
      alert("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session');
    window.location.href = '/';
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.staff_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.firebase_uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Admin Control Panel</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Staff Account Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData}
              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              <LogOut className="w-4 h-4" />
              Exit Admin
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 items-stretch">
          <div className="md:col-span-3 relative flex">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name, Staff ID or Firebase UID..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-6 flex items-center gap-4 min-h-[72px]">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Staff</p>
              <p className="text-xl font-black text-slate-800 leading-none">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/10 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Firebase UID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-sm font-bold text-slate-400">Loading staff directory...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <p className="text-sm font-bold text-slate-400">No staff members found matching your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.firebase_uid} className="transition-colors group">
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-black font-mono">
                          {user.staff_id}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-800">{user.name}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]" title={user.firebase_uid}>
                          {user.firebase_uid}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          user.status === 'blocked' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {user.status === 'blocked' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedUser(user)}
                            className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all"
                            title="Manage User"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading === user.firebase_uid}
                            className={`p-2 rounded-xl transition-all ${
                              user.status === 'blocked'
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                            title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                          >
                            {actionLoading === user.firebase_uid ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.status === 'blocked' ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <UserX className="w-4 h-4" />
                            )}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            disabled={actionLoading === user.firebase_uid}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                            title="Delete User"
                          >
                            {actionLoading === user.firebase_uid ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {selectedUser && (
        <UserManagementModal 
          user={selectedUser}
          items={items}
          onClose={() => setSelectedUser(null)}
          onUpdate={() => {
            fetchData();
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
