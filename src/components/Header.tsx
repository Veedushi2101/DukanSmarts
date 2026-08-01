import React from "react";
import { Search, Bell, QrCode, ShoppingCart, Cloud, Wifi, WifiOff, Store } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useInventory } from "../contexts/InventoryContext";

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenSaleModal: () => void;
  onOpenNotifications: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  onOpenSaleModal,
  onOpenNotifications,
  searchTerm,
  setSearchTerm
}) => {
  const { isFirebaseConnected, currentUser, currentStore } = useAuth();
  const { unreadNotificationsCount, isOnline } = useInventory();

  return (
    // Increased height from h-16 (64px) to h-20 (80px)
    <header className="h-20 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-64 md:w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Maggi, Amul, Parle-G, Barcode..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Network & Offline Status Pill */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-semibold ${
            isOnline
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-300"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Online • Firestore</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Offline Mode (Scans Queued)</span>
            </>
          )}
        </div>

        {/* Quick Scan Barcode Button */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Scan Barcode</span>
        </button>

        {/* POS Quick Sale Button */}
        <button
          onClick={onOpenSaleModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">POS Sale</span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Shop Owner Profile Header Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs">
          <Store className="w-4 h-4 text-slate-600" />
          <div className="text-left hidden md:block">
            <p className="font-bold text-slate-800 leading-tight">{currentUser?.name || "Rajesh Kumar"}</p>
            <p className="text-[10px] text-slate-500">Shop Owner • Kirana Live</p>
          </div>
        </div>
      </div>
    </header>
  );
};