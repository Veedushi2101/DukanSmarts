import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  QrCode, 
  BarChart3, 
  FileText, 
  Settings, 
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "customer_ledger", label: "Khata & POS", icon: Users },
    { id: "scanner", label: "Scanner", icon: QrCode },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Mobile Top App Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
            DS
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tight text-slate-900 leading-tight">DukanSmarts</h1>
            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
              {currentUser?.storeName || "My Kirana Store"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-white p-5 border-r border-slate-800 shrink-0 select-none">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center shadow-md">
            DS
          </div>
          <div className="overflow-hidden">
            <span className="font-black text-base text-white tracking-tight block">DukanSmarts</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block truncate">
              {currentUser?.storeName || "Kirana Core"}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 py-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="font-bold text-xs text-white truncate">{currentUser?.name || "Owner"}</p>
            <p className="text-[10px] text-slate-500 truncate">{currentUser?.phone || "Online"}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Slide-out Drawer for Secondary Pages on Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden flex justify-end animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="w-4/5 max-w-xs bg-slate-950 text-white h-full p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-black text-sm text-white">Menu Options</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5 pt-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition-all ${
                        isActive ? "bg-emerald-500 text-slate-950 font-black" : "text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600/20 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Content Shell */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-20 md:pb-6">
        {children}
      </main>

      {/* Sticky Mobile Bottom Navigation Bar (Fast Thumb Access) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        {[
          { id: "customer_ledger", label: "Khata", icon: Users },
          { id: "scanner", label: "Scanner", icon: QrCode },
          { id: "inventory", label: "Stock", icon: Package },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ].map((btn) => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setActiveTab(btn.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? "text-emerald-600 font-black" : "text-slate-500 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="text-[10px]">{btn.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};