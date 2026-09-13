import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Package,
  IndianRupee,
  Sparkles,
  ArrowUpRight,
  Clock,
  ChevronRight,
  ChevronLeft,
  Zap
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { useAuth } from "../contexts/AuthContext";

interface DashboardPageProps {
  onSelectProduct?: (productId: string) => void;
  onOpenScanner?: () => void;
  onOpenSaleModal?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectProduct = () => {},
  onOpenScanner = () => {},
  onOpenSaleModal = () => {},
  onNavigateTab = () => {}
}) => {
  const { products = [], history = [], predictions = [] } = useInventory();
  const { currentUser } = useAuth();
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  // 1. Dynamic Stock Metrics
  const healthyCount = products.filter((p) => p.currentStock > p.reorderLevel).length;
  const lowStockCount = products.filter((p) => p.currentStock <= p.reorderLevel).length;
  const healthScore = products.length > 0 ? Math.round((healthyCount / products.length) * 100) : 100;

  // 2. High-Priority Items for AI Insights Card
  const highPriorityItems = products.filter((p) => {
    const pred = predictions.find((predItem) => predItem.productId === p.productId);
    return p.currentStock <= p.reorderLevel || pred?.riskLevel === "High";
  });

  useEffect(() => {
    if (highPriorityItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveAlertIndex((prev) => (prev + 1) % highPriorityItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [highPriorityItems.length]);

  const activeProduct = highPriorityItems[activeAlertIndex] || products[0];
  const activePrediction = predictions.find((p) => p.productId === activeProduct?.productId);

  // 3. Helper: Safely convert any Firestore timestamp/date into a standard Date object
  const parseLogDate = (rawTimestamp: any): Date | null => {
    if (!rawTimestamp) return null;
    if (typeof rawTimestamp.toDate === "function") return rawTimestamp.toDate();
    if (rawTimestamp.seconds) return new Date(rawTimestamp.seconds * 1000);
    const d = new Date(rawTimestamp);
    return isNaN(d.getTime()) ? null : d;
  };

  // 4. Calculate Real-Time 7-Day Revenue Trends
  const { weeklySalesData, todayTotalRevenue, todayTransactionCount } = useMemo(() => {
    const days: {
      dateKey: string;
      dayName: string;
      formattedDate: string;
      revenue: number;
      unitsSold: number;
      txCount: number;
    }[] = [];

    const now = new Date();
    const todayKey = now.toISOString().split("T")[0];

    // Build the 7-day rolling window ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const formattedDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

      days.push({
        dateKey,
        dayName,
        formattedDate,
        revenue: 0,
        unitsSold: 0,
        txCount: 0
      });
    }

    // Fast product price dictionary
    const priceMap = new Map<string, number>();
    products.forEach((p) => {
      const price = Number(p.sellingPrice || (p as any).price || p.mrp || 14);
      priceMap.set(p.productId, price);
    });

    let todayRev = 0;
    let todayTx = 0;

    // Aggregate logs
    history.forEach((log: any) => {
      const action = String(log.action || "").toUpperCase();
      if (action === "SALE" || action === "STOCK_OUT") {
        const logDateObj = parseLogDate(log.timestamp);
        if (!logDateObj) return;

        const logDateKey = logDateObj.toISOString().split("T")[0];
        const dayMatch = days.find((d) => d.dateKey === logDateKey);

        let qty = 0;
        if (typeof log.previousStock === "number" && typeof log.updatedStock === "number") {
          qty = Math.abs(log.previousStock - log.updatedStock);
        } else {
          qty = Math.abs(log.quantityChange || log.qty || log.stockDelta || 1);
        }

        const unitPrice = priceMap.get(log.productId) || 14;
        const totalAmount = qty * unitPrice;

        if (dayMatch) {
          dayMatch.revenue += totalAmount;
          dayMatch.unitsSold += qty;
          dayMatch.txCount += 1;
        }

        if (logDateKey === todayKey) {
          todayRev += totalAmount;
          todayTx += 1;
        }
      }
    });

    const maxRev = Math.max(...days.map((d) => d.revenue), 100);

    const formattedWeeklyData = days.map((d) => ({
      ...d,
      pct: d.revenue > 0 ? Math.max(12, Math.min(100, Math.round((d.revenue / maxRev) * 100))) : 4
    }));

    return {
      weeklySalesData: formattedWeeklyData,
      todayTotalRevenue: todayRev,
      todayTransactionCount: todayTx
    };
  }, [history, products]);

  const displayRevenue = `₹${todayTotalRevenue.toLocaleString("en-IN")}`;
  const displayTransactions = `${todayTransactionCount} Checkout Sales Today`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Welcome back, {currentUser?.name || "Store Owner"}
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              Kirana Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.storeName || "DukanSmarts Kirana"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab("scanner")}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Scan Barcode</span>
          </button>
          <button
            onClick={() => onNavigateTab("customer-ledger")}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <IndianRupee className="w-4 h-4" />
            <span>POS Quick Sale</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Inventory Health Score</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{healthScore}%</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Optimum Kirana stock turnover</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${healthScore}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monitored Products</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{products.length} SKUs</span>
              <span className="text-xs font-semibold text-slate-500">Active</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Realtime Firestore sync</p>
          </div>
          <div className="text-[11px] font-medium text-indigo-600">
            {healthyCount} items healthy
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Predicted Stock Risks</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">{lowStockCount} Items</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Action Required</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Depletion predictions active</p>
          </div>
          <button
            onClick={() => onNavigateTab("forecast")}
            className="text-[11px] font-semibold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View AI Restock List</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{displayRevenue}</span>
              <span className="text-xs font-bold text-teal-600 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{displayTransactions}</p>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Avg ticket size: <span className="font-bold text-slate-800">
              ₹{todayTransactionCount > 0 ? Math.round(todayTotalRevenue / todayTransactionCount) : 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Glassmorphism AI Insight Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-white">DukanSmarts AI Insight</h3>
                  <p className="text-[11px] text-slate-400">Kirana Intelligence Engine</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {highPriorityItems.length > 1 && (
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/10 text-xs">
                    <button
                      onClick={() => setActiveAlertIndex((prev) => (prev === 0 ? highPriorityItems.length - 1 : prev - 1))}
                      className="p-1 hover:bg-white/20 rounded text-slate-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1">
                      {activeAlertIndex + 1}/{highPriorityItems.length}
                    </span>
                    <button
                      onClick={() => setActiveAlertIndex((prev) => (prev + 1) % highPriorityItems.length)}
                      className="p-1 hover:bg-white/20 rounded text-slate-300 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  High Priority ({highPriorityItems.length})
                </span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-3 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-base text-white">
                    {activeProduct?.productName || "Inventory Item"} ({activeProduct?.currentStock || 0} {activeProduct?.unit || "units"} remaining) is projected to deplete in {activePrediction?.daysRemaining ? `${activePrediction.daysRemaining * 24} hours` : "24 hours"}.
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {activePrediction?.reasoning || `${activeProduct?.productName || 'This item'} stock is below reorder threshold (${activeProduct?.reorderLevel || 15} units). Recommended reorder batch size: ${activeProduct?.reorderQuantity || 25} units.`}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Confidence</span>
                    <span className="font-bold text-emerald-400">{activePrediction?.confidence || "94.2%"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Recommended Order</span>
                    <span className="font-bold text-white">{activePrediction?.recommendedOrder || activeProduct?.reorderQuantity || 25} units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Supplier</span>
                    <span className="font-bold text-slate-200">{activeProduct?.supplier || "Local Vendor"}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab("forecast")}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md cursor-pointer"
                >
                  Action Order
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Sales Revenue Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Weekly Revenue & Velocity Trends</h3>
                <p className="text-xs text-slate-500">Live Kirana checkout revenue calculated from Firestore</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" /> Live Firestore Sync
              </div>
            </div>

            <div className="h-52 pt-6 flex items-end justify-between gap-3 px-2 border-b border-slate-100">
              {weeklySalesData.map((item, idx) => {
                const isToday = idx === weeklySalesData.length - 1;

                return (
                  <div key={item.dateKey} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xl pointer-events-none z-20 whitespace-nowrap border border-slate-700">
                      ₹{item.revenue.toLocaleString("en-IN")} ({item.unitsSold} units • {item.txCount} sales)
                    </div>

                    <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden relative">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                            : item.revenue > 0
                            ? "bg-slate-800 group-hover:bg-emerald-600"
                            : "bg-slate-200"
                        }`}
                        style={{ height: `${item.pct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold ${isToday ? "text-emerald-600" : "text-slate-500"}`}>
                      {item.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Realtime Inventory Events */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-slate-900">Realtime Inventory Events</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px]">
            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No recent inventory logs available.
              </div>
            ) : (
              history.slice(0, 6).map((item: any) => {
                const formattedTime = (() => {
                  const d = parseLogDate(item.timestamp);
                  return d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now";
                })();

                return (
                  <div
                    key={item.historyId || Math.random()}
                    onClick={() => onSelectProduct(item.productId)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                        {item.productName || item.productId}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.action === "STOCK_IN" ? "bg-emerald-100 text-emerald-800" :
                        item.action === "SALE" || item.action === "STOCK_OUT" ? "bg-indigo-100 text-indigo-800" :
                        "bg-slate-200 text-slate-800"
                      }`}>
                        {item.action}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Stock: <span className="font-semibold text-slate-700">{item.previousStock ?? 0}</span> → <span className="font-bold text-slate-900">{item.updatedStock ?? 0}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => onNavigateTab("inventory")}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer"
          >
            View Full Inventory Master →
          </button>
        </div>
      </div>
    </div>
  );
};