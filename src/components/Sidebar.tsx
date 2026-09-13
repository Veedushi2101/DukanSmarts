import React from "react";
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
  LogOut
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
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },
    {
      id: "customer-ledger",
      label: "Customer Ledger",
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      badge: "Ledger"
    },
    {
      id: "scanner",
      label: "Barcode Scanner",
      icon: <QrCode className="w-4 h-4 text-emerald-400" />,
      badge: "Live"
    },
    {
      id: "forecast",
      label: "AI Forecast",
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      badge: "Groq AI"
    },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "orders", label: "Purchase Orders", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "reports", label: "Reports & Logs", icon: <FileText className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> }
  ];

  // Derive display initials from dynamic user name
  const getInitials = (name?: string) => {
    if (!name) return "DS";
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-full border-r border-slate-800 shrink-0 z-20">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
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

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <span className="shrink-0">{item.icon}</span>
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
      </div>

      {/* Footer User Profile & Session Controls */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-2">
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
  );
};