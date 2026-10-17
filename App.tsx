
import React, { useState, useEffect, useCallback } from 'react';
import { View, Item, InventoryTransaction, Category, User as DBUser } from './types';
import { dbService } from './services/dbService';
import { getDatabaseUrl } from './neonClient';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InventoryManager from './components/InventoryManager';
import TransactionForm from './components/TransactionForm';
import History from './components/History';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import SmartAssistant from './components/SmartAssistant';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { LogOut, Loader2, Database, ShieldAlert, Link as LinkIcon, CheckCircle2, RotateCcw, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<DBUser | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [inventoryFilter, setInventoryFilter] = useState<'All' | 'Healthy' | 'Restock'>('All');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const [preSelectedItem, setPreSelectedItem] = useState<Item | null>(null);
  
  const [manualDbUrl, setManualDbUrl] = useState('');
  const [dbConnected, setDbConnected] = useState(!!getDatabaseUrl());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setBlockedError(null);
      if (currentUser && getDatabaseUrl()) {
        await dbService.runMigrations();
        const existingUser = await dbService.getUser(currentUser.uid);
        
        if (existingUser) {
          if (existingUser.status === 'blocked') {
            await signOut(auth);
            setUser(null);
            setDbUser(null);
            setBlockedError("Your account has been suspended. Please contact the administrator.");
            setAuthLoading(false);
            return;
          }
          setDbUser(existingUser);
        } else {
          setShowOnboarding(true);
        }
      }
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !onboardingName.trim()) return;
    
    setLoading(true);
    try {
      const staffId = await dbService.getNextStaffId();
      const newUser: DBUser = {
        firebase_uid: user.uid,
        staff_id: staffId,
        name: onboardingName.trim()
      };
      await dbService.createUser(newUser);
      setDbUser(newUser);
      setShowOnboarding(false);
    } catch (error: any) {
      alert("Error during onboarding: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    const url = getDatabaseUrl();
    if (!user || !url) {
      setDbConnected(false);
      return;
    }
    
    setLoading(true);
    setDbError(null);
    setDbConnected(true);
    
    try {
      const [fetchedItems, fetchedTransactions, fetchedCategories] = await Promise.all([
        dbService.getInventory(),
        dbService.getTransactions(),
        dbService.getCategories()
      ]);
      setItems(fetchedItems);
      setTransactions(fetchedTransactions);
      setCategories(fetchedCategories);
    } catch (e: any) {
      console.error("Refresh Error", e);
      setDbError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const handleSaveDbUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = manualDbUrl.trim();
    if (!cleanUrl.startsWith('postgresql://')) {
      setDbError("Invalid URL. It must start with 'postgresql://'");
      return;
    }
    localStorage.setItem('NEON_DATABASE_URL', cleanUrl);
    setDbConnected(true);
    refreshData();
  };

  const handleResetDb = () => {
    if (confirm("Reset database connection? You will need to re-paste your Neon URL.")) {
      localStorage.removeItem('NEON_DATABASE_URL');
      setDbConnected(false);
      setDbError(null);
    }
  };

  const handleAddItem = async (item: any) => {
    if (!user) return;
    try {
      await dbService.addItem(item, user.uid);
      await refreshData();
    } catch (e: any) {
      alert("Error adding item: " + e.message);
    }
  };

  const handleUpdateItem = async (id: number | string, item: any) => {
    try {
      await dbService.updateItem(id, item);
      await refreshData();
    } catch (e: any) {
      alert("Error updating item: " + e.message);
    }
  };

  const handleAddCategory = async (name: string, prefix: string) => {
    try {
      await dbService.addCategory(name, prefix);
      await refreshData();
    } catch (e: any) {
      alert("Error adding category: " + e.message);
    }
  };

  const handleTransaction = async (data: any) => {
    if (!user) return;
    try {
      await dbService.processTransaction({
        ...data,
        user_email: user.email || 'unknown',
        staff_name: dbUser?.name,
        staff_id: dbUser?.staff_id
      }, user.uid);
      await refreshData();
      setPreSelectedItem(null);
      setCurrentView('history');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleQuickTransaction = (item: Item) => {
    setPreSelectedItem(item);
    setCurrentView('transactions');
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-medium animate-pulse">Initializing Secure Session...</p>
      </div>
    );
  }

  if (currentView === 'admin-dashboard') {
    const isAdmin = !!sessionStorage.getItem('admin_session');
    if (!isAdmin) {
      setCurrentView('admin-login');
      return null;
    }
    return <AdminDashboard />;
  }

  if (!user) {
    if (currentView === 'admin-login') {
      return <AdminLogin onLoginSuccess={() => setCurrentView('admin-dashboard')} />;
    }
    return (
      <div className="relative">
        <Login />
        {blockedError && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4">
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <p className="text-sm font-bold">{blockedError}</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setCurrentView('admin-login')}
          className="fixed bottom-4 left-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
        >
          Admin Portal
        </button>
      </div>
    );
  }

  if (!dbConnected || dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-500/10 rounded-2xl">
              <Database className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Team Database Connection</h1>
              <p className="text-slate-400 text-sm">Link your shared Neon PostgreSQL instance</p>
            </div>
          </div>

          <div className="space-y-8">
            <form onSubmit={handleSaveDbUrl} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" />
                  Paste Connection String Here
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  placeholder="postgresql://user:password@ep-name-123.region.neon.tech/neondb"
                  className="w-full px-4 py-4 bg-slate-100 border border-slate-200 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  value={manualDbUrl}
                  onChange={(e) => setManualDbUrl(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group"
              >
                <CheckCircle2 className="w-5 h-5" />
                Connect & Sync Team Data
              </button>
            </form>

            <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-500 uppercase tracking-tight">Setup Instructions</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Make sure to run the migration SQL script in your Neon console to enable the Category and Team Tracking features.
                  </p>
                </div>
              </div>
            </div>

            {dbError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
                <strong>Error:</strong> {dbError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    const stocks = items.map(i => ({ 
      item_id: i.id, 
      current_quantity: i.current_stock, 
      last_updated: new Date().toISOString() 
    }));

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            items={items} 
            stocks={stocks} 
            onViewItems={() => {
              setInventoryFilter('All');
              setCurrentView('items');
            }} 
            onViewLowStock={() => {
              setInventoryFilter('Restock');
              setCurrentView('items');
            }}
          />
        );
      case 'items':
        return (
          <InventoryManager 
            items={items} 
            categories={categories}
            onAddItem={handleAddItem} 
            onUpdateItem={handleUpdateItem}
            onAddCategory={handleAddCategory}
            onQuickTransaction={handleQuickTransaction}
            dbUser={dbUser}
            initialStatusFilter={inventoryFilter}
          />
        );
      case 'transactions':
        return (
          <TransactionForm 
            items={items} 
            categories={categories}
            onTransaction={handleTransaction} 
            preSelectedItem={preSelectedItem}
          />
        );
      case 'history':
        return <History transactions={transactions} items={items} />;
      default:
        return <Dashboard items={items} stocks={stocks} />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="p-5 bg-indigo-500/10 rounded-3xl">
                <UserCircle className="w-12 h-12 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Staff Onboarding</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">Welcome to the team! Please provide your full name to generate your official Staff ID.</p>
              </div>
              <form onSubmit={handleOnboardingSubmit} className="w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left ml-1">Full Name</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    value={onboardingName}
                    onChange={(e) => setOnboardingName(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register Staff Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Layout currentView={currentView} setView={setCurrentView} dbUser={dbUser} onLogout={handleLogout}>
        {loading && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Syncing Team Data...
            </div>
          </div>
        )}
        {renderView()}
      </Layout>

      {/* AI Smart Assistant */}
      <SmartAssistant />
    </div>
  );
};

export default App;
