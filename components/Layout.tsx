
import React from 'react';
import { View, User } from '../types';
import { LayoutDashboard, Package, ArrowLeftRight, History, LogOut, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  dbUser: User | null;
  onLogout: () => void;
  onAdminClick?: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, dbUser, onLogout, onAdminClick, children }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'transactions', label: 'Stock In/Out', icon: ArrowLeftRight, hidden: dbUser?.access_level === 'read_only' },
    { id: 'history', label: 'History', icon: History, hidden: dbUser?.access_level === 'read_only' },
  ].filter(item => !item.hidden);

  const initials = dbUser?.name ? dbUser.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Package className="w-6 h-6" />
            SmartStock
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Inventory Management</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}

          {onAdminClick && (
            <button
              onClick={onAdminClick}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-black text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all uppercase tracking-widest mt-4 border border-dashed border-slate-200"
            >
              <ShieldCheck className="w-5 h-5" />
              Admin Panel
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>

          <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate">
                {dbUser?.name || 'User'} ({dbUser?.staff_id || 'N/A'})
              </p>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Session</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 capitalize">
            {currentView === 'dashboard' ? 'Overview' : currentView}
          </h2>
          <div className="text-sm text-slate-500 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
