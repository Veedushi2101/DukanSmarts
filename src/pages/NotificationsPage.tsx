import React, { useState, useMemo } from "react";
import {
  Sparkles,
  AlertTriangle,
  Sliders,
  Check,
  PackageCheck,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, products, updateStock } = useInventory();
  const [filter, setFilter] = useState<string>("All");
  const [sensitivity, setSensitivity] = useState<number>(80);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Dynamic filter matching
  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "All") return true;
      if (filter === "AI Alerts") return n.type === "AI Forecast";
      if (filter === "Orders") return n.type === "Order";
      if (filter === "Inventory Updates") return n.type === "Low Stock";
      return true;
    });
  }, [notifications, filter]);

  // Pick top priority alert dynamically from live database
  const topCriticalAlert = useMemo(() => {
    const unread = notifications.filter((n) => !n.read && n.status !== "read");
    const highPriority = unread.find((n) => n.priority === "High");
    if (highPriority) return highPriority;
    return unread[0] || null;
  }, [notifications]);

  // Matched product for top critical alert (if applicable)
  const alertProduct = useMemo(() => {
    if (!topCriticalAlert?.productId) return null;
    return products.find((p) => p.productId === topCriticalAlert.productId) || null;
  }, [topCriticalAlert, products]);

  // Quick Restock action for the hero card
  const handleQuickRestock = async (productId: string, qty: number, notifId?: string) => {
    try {
      await updateStock(productId, qty, "STOCK_IN");
      if (notifId) {
        await markNotificationRead(notifId);
      }
      setActionSuccess(`Restocked +${qty} units successfully.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      console.error("Restock failure:", err);
      alert("Failed to update stock.");
    }
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto font-sans text-xs">
      {/* Title & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
            Notifications & Alerts Center
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Realtime Kirana alerts, AI restock notifications, and purchase order tracking
          </p>
        </div>

        {/* Scrollable Filter Badges on Mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
          {["All", "AI Alerts", "Orders", "Inventory Updates"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === f
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 active:bg-slate-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Dynamic Primary Hero Alert Card */}
      {topCriticalAlert ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 rounded-2xl text-white border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {topCriticalAlert.priority || "High"} Priority AI Alert
              </span>
              <h3 className="font-bold text-sm sm:text-base text-white mt-1 leading-snug">
                {topCriticalAlert.title}
              </h3>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-xl border border-white/10 space-y-3">
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              {topCriticalAlert.message}
            </p>

            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="text-emerald-400 font-bold">
                  Recommended: +{alertProduct?.reorderQuantity || 25} units
                </span>
                <span className="text-slate-400">
                  Supplier: {alertProduct?.supplier || "Direct Kirana Link"}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 sm:pt-0">
                <button
                  onClick={() => markNotificationRead(topCriticalAlert.notificationId)}
                  className="flex-1 sm:flex-initial px-3 py-2 min-h-[40px] bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-medium rounded-xl text-xs cursor-pointer flex items-center justify-center"
                >
                  Dismiss
                </button>
                {alertProduct && (
                  <button
                    onClick={() =>
                      handleQuickRestock(
                        alertProduct.productId,
                        alertProduct.reorderQuantity || 25,
                        topCriticalAlert.notificationId
                      )
                    }
                    className="flex-1 sm:flex-initial px-4 py-2 min-h-[40px] bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" /> Restock (+{alertProduct.reorderQuantity || 25})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">All Inventory Levels Healthy</h4>
              <p className="text-slate-500 text-xs">No active stockout alerts or critical reorders pending.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Notifications List + Side Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* List Column */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">
            Active Notifications ({filteredNotifs.length})
          </h3>

          {filteredNotifs.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No notifications matching this filter.
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.notificationId}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3 sm:gap-4 ${
                  !n.read
                    ? "bg-white border-emerald-200 shadow-xs"
                    : "bg-slate-50/80 border-slate-200 opacity-80"
                }`}
              >
                <div
                  className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                    n.priority === "High"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug truncate">
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed break-words">
                    {n.message}
                  </p>
                </div>

                {!n.read && (
                  <button
                    onClick={() => markNotificationRead(n.notificationId)}
                    className="p-2 min-h-[36px] min-w-[36px] rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 text-xs font-semibold shrink-0 cursor-pointer flex items-center justify-center"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Side Panel Controls & Metrics */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Inventory Monitoring Stats</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Total Tracked SKUs</span>
                <span className="font-bold text-slate-900 text-sm">{products.length} Products</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Low Stock Count</span>
                <span className="font-bold text-rose-600 text-sm">
                  {products.filter((p) => (p.currentStock || 0) <= (p.reorderLevel || 0)).length} Items
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-slate-900">Alert Sensitivity Controls</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                  <span>Restock Sensitivity</span>
                  <span className="text-emerald-600 font-bold">{sensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer min-h-[30px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-700">Auto AI Restock Triggers</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer min-h-[24px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};