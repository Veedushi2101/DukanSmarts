import React, { useState } from "react";
import {
  Bell,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Sliders,
  Filter,
  Check,
  Clock,
  ArrowRight
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, products } = useInventory();
  const [filter, setFilter] = useState<string>("All");
  const [sensitivity, setSensitivity] = useState<number>(80);

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "All") return true;
    if (filter === "AI Alerts") return n.type === "AI Forecast";
    if (filter === "Orders") return n.type === "Order";
    if (filter === "Inventory Updates") return n.type === "Low Stock";
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications & AI Alerts Center</h1>
          <p className="text-xs text-slate-500">
            Realtime Kirana alerts, AI restock notifications, and purchase order tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["All", "AI Alerts", "Orders", "Inventory Updates"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Glass AI Restock Alert Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              High Priority AI Restock Alert
            </span>
            <h3 className="font-bold text-base text-white mt-1">
              Maggi 2-Min Noodles stock is predicted to deplete tomorrow evening
            </h3>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Groq Llama-3.3 AI Model detected accelerated weekend purchasing velocity. Current stock: 18 packs. Recommended order: 25 packs from Nestle DistriLink.
          </p>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-emerald-400 font-bold">Recommended: 25 packs</span>
              <span className="text-slate-400">Supplier: Nestle DistriLink</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg text-xs">
                Remind Later
              </button>
              <button className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md">
                Order Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Notifications List + Side Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Column 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-bold text-sm text-slate-900">Active Notifications ({filteredNotifs.length})</h3>

          {filteredNotifs.map((n) => (
            <div
              key={n.notificationId}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                !n.read ? "bg-white border-emerald-200 shadow-xs" : "bg-slate-50/80 border-slate-200 opacity-80"
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${
                n.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              {!n.read && (
                <button
                  onClick={() => markNotificationRead(n.notificationId)}
                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold shrink-0"
                  title="Mark Read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Side Panel Controls & Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">AI Quick Stats</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Suggestions Acted Upon</span>
                <span className="font-bold text-emerald-600 text-sm">92%</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Stockouts Prevented</span>
                <span className="font-bold text-slate-900 text-sm">18 This Month</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
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
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-slate-700">Auto-Order Draft Creation</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
