import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  QrCode,
  Sparkles,
  Bell,
  BarChart3,
  ShoppingCart,
  FileText,
  Settings,
  Store,
  Users,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { AppUser } from "../types";

export type NavTab =
  | "dashboard"
  | "inventory"
  | "scanner"
  | "forecast"
  | "notifications"
  | "analytics"
  | "orders"
  | "reports"
  | "settings"
  | "customer-ledger";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { id: "customer-ledger", label: "Customer Records", icon: <Users className="w-4 h-4 text-emerald-400 shrink-0" /> },
    { id: "scanner", label: "Barcode Scanner", icon: <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />, badge: "Live" },
    { id: "inventory", label: "Inventory", icon: <Package className="w-4 h-4 shrink-0" /> },
    { id: "forecast", label: "AI Forecast", icon: <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />, badge: "Groq AI" },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4 shrink-0" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { id: "orders", label: "Purchase Orders", icon: <ShoppingCart className="w-4 h-4 shrink-0" /> },
    { id: "reports", label: "Reports & Logs", icon: <FileText className="w-4 h-4 shrink-0" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4 shrink-0" /> }
  ];

  const getInitials = (name?: string) => {
    if (!name) return "DS";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const handleTabClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileDrawerOpen(false);
  };

  const navList = (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              isActive
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-1">
              {item.icon}
              <span className="whitespace-nowrap text-xs font-semibold truncate">
                {item.label}
              </span>
            </div>

            {item.badge && (
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* 1. Mobile Top Bar (ONLY visible on screens smaller than md) */}
      <div className="md:hidden w-full h-[57px] bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-xs shrink-0">
            <Store className="w-4 h-4 text-slate-950" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm text-white">DukanSmarts</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1 rounded">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {currentUser?.storeName || "Kirana Store Management"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 active:bg-slate-700 transition-all cursor-pointer shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Mobile Drawer Overlay (Floats ABOVE screen, closes on tap) */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs md:hidden flex justify-end"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs bg-slate-900 text-slate-300 h-full flex flex-col justify-between shadow-2xl p-4 border-l border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-sm text-white">Navigation</span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {navList}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(currentUser?.name)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{currentUser?.name || "Store Owner"}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser?.role || "OWNER"}</p>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Desktop Sidebar (STRICTLY HIDDEN below md: 768px) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between h-full border-r border-slate-800 shrink-0 z-20">
        <div className="p-4 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20 shrink-0">
              <Store className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-white tracking-wide">DukanSmarts</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {currentUser?.storeName || "Kirana Store Management"}
              </p>
            </div>
          </div>

          {navList}
        </div>

        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 px-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
              {getInitials(currentUser?.name)}
            </div>
            <div className="text-left overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {currentUser?.name || "Store Owner"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.role || "OWNER"} • {currentUser?.storeName || "Active"}
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};