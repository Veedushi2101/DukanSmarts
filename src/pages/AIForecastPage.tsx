import React, { useState, useMemo } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { useAuth } from "../contexts/AuthContext";
import {
  RefreshCw,
  Cpu,
  Sliders,
  AlertTriangle,
  MessageCircle,
  CheckCircle2
} from "lucide-react";

export const AIForecastPage: React.FC = () => {
  const { products = [], history = [], triggerProductAI } = useInventory();
  const { currentUser } = useAuth();

  const [selectedProductId, setSelectedProductId] = useState<string>("ALL");
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.0);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // 1. Resolve Active SKU
  const currentSelectedProduct = useMemo(() => {
    if (selectedProductId === "ALL") return null;
    return products.find((p) => p.productId === selectedProductId) || null;
  }, [products, selectedProductId]);

  // 2. Safe Firestore Timestamp Parser
  const parseTimestamp = (raw: any): Date | null => {
    if (!raw) return null;
    if (typeof raw.toDate === "function") return raw.toDate();
    if (typeof raw.seconds === "number") return new Date(raw.seconds * 1000);
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  // 3. Compute Real 7-Day Rolling History & True Sales Velocity
  const { rollingDays, total7DayUnitsSold, daysWithSalesCount } = useMemo(() => {
    const days: {
      dateKey: string;
      dayLabel: string;
      actualSales: number;
      isToday: boolean;
    }[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const target = new Date();
      target.setDate(now.getDate() - i);
      const dateKey = target.toISOString().split("T")[0];
      const dayLabel = target.toLocaleDateString("en-IN", { weekday: "short" });

      days.push({
        dateKey,
        dayLabel: i === 0 ? "Today" : dayLabel,
        actualSales: 0,
        isToday: i === 0
      });
    }

    let unitsAccumulator = 0;

    history.forEach((log: any) => {
      const action = String(log.action || "").toUpperCase();
      if (action === "SALE" || action === "STOCK_OUT") {
        if (selectedProductId !== "ALL" && log.productId !== selectedProductId) {
          return;
        }

        const logDate = parseTimestamp(log.timestamp);
        if (!logDate) return;

        const logDateKey = logDate.toISOString().split("T")[0];
        const match = days.find((d) => d.dateKey === logDateKey);

        if (match) {
          const qty =
            typeof log.previousStock === "number" && typeof log.updatedStock === "number"
              ? Math.abs(log.previousStock - log.updatedStock)
              : Math.abs(log.quantityChange || log.qty || log.stockDelta || 1);

          match.actualSales += qty;
          unitsAccumulator += qty;
        }
      }
    });

    const activeDays = days.filter((d) => d.actualSales > 0).length;

    return {
      rollingDays: days,
      total7DayUnitsSold: unitsAccumulator,
      daysWithSalesCount: activeDays
    };
  }, [history, selectedProductId]);

  // Actual Historical Daily Velocity
  const realDailyVelocity = useMemo(() => {
    return Math.max(0.2, parseFloat((total7DayUnitsSold / 7).toFixed(1)));
  }, [total7DayUnitsSold]);

  // 4. Forecast Chart Bars
  const chartBars = useMemo(() => {
    const baseDailyDemand = realDailyVelocity * demandMultiplier;
    const maxBarUnits = Math.max(
      ...rollingDays.map((d) => d.actualSales),
      baseDailyDemand * 1.4,
      5
    );

    return rollingDays.map((item, idx) => {
      const isWeekend = idx >= 5;
      const projectedForDay = Math.max(
        1,
        Math.round(baseDailyDemand * (isWeekend ? 1.25 : 1.0))
      );

      return {
        ...item,
        predictedDemand: projectedForDay,
        histPct:
          item.actualSales > 0
            ? Math.min(100, Math.round((item.actualSales / maxBarUnits) * 100))
            : 0,
        predPct: Math.min(100, Math.max(6, Math.round((projectedForDay / maxBarUnits) * 100)))
      };
    });
  }, [rollingDays, realDailyVelocity, demandMultiplier]);

  // 5. Zero-Fallback Dynamic Metrics
  const kpis = useMemo(() => {
    const totalSKUs = products.length;
    const lowStockSKUs = products.filter(
      (p) => (p.currentStock || 0) <= (p.reorderLevel || 0)
    ).length;

    // Evaluate over past 6 full days (excluding ongoing today)
    const evaluatedDays = chartBars.slice(0, 6);
    let totalError = 0;
    let totalVolume = 0;
    let daysWithActivity = 0;

    evaluatedDays.forEach((d) => {
      if (d.actualSales > 0) {
        totalError += Math.abs(d.actualSales - d.predictedDemand);
        totalVolume += Math.max(d.actualSales, d.predictedDemand);
        daysWithActivity++;
      }
    });

    let accuracyText = "N/A";
    let accuracySubtext = "Awaiting checkout logs";

    if (totalVolume > 0 && daysWithActivity > 0) {
      // True WAPE parity
      const calculatedParity = Math.max(0, Math.round((1 - totalError / totalVolume) * 100));
      accuracyText = `${calculatedParity}%`;
      accuracySubtext = `Evaluated across ${daysWithActivity} active day(s)`;
    }

    const confidenceScore =
      daysWithSalesCount === 0
        ? "0.0%"
        : `${Math.min(99.0, parseFloat((50 + daysWithSalesCount * 7.5).toFixed(1)))}%`;

    return {
      totalSKUs,
      lowStockSKUs,
      accuracyText,
      accuracySubtext,
      confidenceText: confidenceScore
    };
  }, [products, chartBars, daysWithSalesCount]);

  // 6. Depletion Horizon Simulation
  const stockoutSimulation = useMemo(() => {
    const activeEffectiveVelocity = Math.max(0.2, realDailyVelocity * demandMultiplier);

    if (currentSelectedProduct) {
      const stock = currentSelectedProduct.currentStock || 0;
      const days = (stock / activeEffectiveVelocity).toFixed(1);
      const hours = Math.round((stock / activeEffectiveVelocity) * 24);
      const isCritical = stock <= (currentSelectedProduct.reorderLevel || 5);

      return {
        stock,
        days,
        hours,
        isCritical,
        summary:
          isCritical || hours <= 24
            ? `Critical: Stock (${stock} ${currentSelectedProduct.unit || "units"}) will run out in ~${hours} hours at current velocity.`
            : `Stock of ${stock} ${currentSelectedProduct.unit || "units"} will sustain store sales for ~${days} days.`
      };
    }

    const totalCatalogStock = products.reduce((acc, p) => acc + (p.currentStock || 0), 0);
    const catalogDays = (totalCatalogStock / activeEffectiveVelocity).toFixed(1);

    return {
      stock: totalCatalogStock,
      days: catalogDays,
      hours: Math.round((totalCatalogStock / activeEffectiveVelocity) * 24),
      isCritical: kpis.lowStockSKUs > 0,
      summary: `Total store inventory (${totalCatalogStock} items) is projected to turn over in ~${catalogDays} days under current demand pace.`
    };
  }, [currentSelectedProduct, products, realDailyVelocity, demandMultiplier, kpis.lowStockSKUs]);

  // 7. Action: Send Restock Order via WhatsApp
  const handleTriggerWhatsAppRestock = (product: any) => {
    const target = product || currentSelectedProduct || products.find((p) => p.currentStock <= p.reorderLevel);
    if (!target) {
      alert("No low-stock product selected for restocking.");
      return;
    }

    const orderQty = target.reorderQuantity || 20;
    const storeTitle = currentUser?.billHeaderName || currentUser?.storeName || "My Kirana Store";
    const message = encodeURIComponent(
      `*PURCHASE ORDER REQUEST*\nStore: ${storeTitle}\nItem: ${target.productName}\nBarcode: ${target.barcode}\nCurrent Stock: ${target.currentStock} ${target.unit || "units"}\n*Requested Reorder Qty: ${orderQty} ${target.unit || "units"}*\n\nPlease confirm delivery availability.`
    );

    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  // 8. Re-evaluate AI Models
  const handleRecalculate = async () => {
    if (products.length === 0) return;
    setIsRecalculating(true);
    try {
      for (const prod of products) {
        await triggerProductAI(prod);
      }
    } catch (e) {
      console.error("AI Sync error:", e);
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-xs font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">AI Inventory Forecasting</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Cpu className="w-3 h-3" /> Realtime Rolling Engine
            </span>
          </div>
          <p className="text-slate-500 mt-1">
            Depletion forecasting based on store checkout velocity and supplier lead windows
          </p>
        </div>

        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRecalculating ? "animate-spin" : ""}`} />
          <span>{isRecalculating ? "Synchronizing Predictions..." : "Refresh Forecast Models"}</span>
        </button>
      </div>

      {/* Dynamic Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">7-Day Sales Volume</span>
          <div className="text-2xl font-black text-slate-900">{total7DayUnitsSold} Units</div>
          <span className="text-[10px] font-bold text-emerald-600">
            ~{realDailyVelocity} units/day velocity
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Stockout Warnings</span>
          <div className="text-2xl font-black text-amber-600">{kpis.lowStockSKUs} SKUs</div>
          <span className="text-[10px] text-slate-400">At or below reorder threshold</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Forecast Reliability</span>
          <div className="text-2xl font-black text-indigo-600">{kpis.confidenceText}</div>
          <span className="text-[10px] text-slate-400">
            {daysWithSalesCount >= 3 ? "Trained on active checkout history" : "Warming up model baseline"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Historical Accuracy</span>
          <div className={`text-2xl font-black ${kpis.accuracyText === "N/A" ? "text-slate-400" : "text-emerald-600"}`}>
            {kpis.accuracyText}
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            {kpis.accuracySubtext}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {currentSelectedProduct
                  ? `Consumption Trend: ${currentSelectedProduct.productName}`
                  : "Store-Wide Daily Sales vs Expected Demand"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Comparison of actual receipts recorded in Firestore with projected depletion curves
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Recorded Sales
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Projected Demand
              </div>
            </div>
          </div>

          {daysWithSalesCount < 2 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Fewer than 2 days of sales logs found. Complete more POS sales to refine trend accuracy.
              </span>
            </div>
          )}

          <div className="h-64 pt-6 flex items-end justify-between gap-2 border-b border-slate-100 px-2">
            {chartBars.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                  Sold: {item.actualSales} | Expected: {item.predictedDemand}
                </div>

                <div className="w-full flex items-end justify-center gap-1.5 h-44">
                  <div
                    className="w-1/2 bg-slate-900 rounded-t-md transition-all duration-300"
                    style={{ height: `${item.histPct}%` }}
                    title={`Actual Sold: ${item.actualSales} units`}
                  />
                  <div
                    className="w-1/2 bg-emerald-500 rounded-t-md shadow-xs transition-all duration-300"
                    style={{ height: `${item.predPct}%` }}
                    title={`Projected Demand: ${item.predictedDemand} units`}
                  />
                </div>

                <span
                  className={`text-[10px] font-bold truncate text-center max-w-[50px] ${
                    item.isToday ? "text-emerald-600 font-extrabold" : "text-slate-500"
                  }`}
                >
                  {item.dayLabel}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  {currentSelectedProduct
                    ? `${currentSelectedProduct.productName}: Reorder threshold is ${currentSelectedProduct.reorderLevel || 5} units`
                    : `${kpis.lowStockSKUs} products currently require wholesale reordering`}
                </p>
                <p className="text-[11px] text-slate-500">
                  Lead time buffer: Order ~48 hours before estimated depletion date
                </p>
              </div>
            </div>

            <button
              onClick={() => handleTriggerWhatsAppRestock(currentSelectedProduct)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Supplier Order</span>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Scenario Simulator */}
        <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Demand Stress-Test Simulator</h3>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                Focus Specific Inventory SKU
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Store Products (Aggregate)</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} ({p.currentStock} in stock)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-2 font-bold">
                <span className="text-slate-400">Festival / Weekend Surge Multiplier</span>
                <span className="text-emerald-400 font-mono">{demandMultiplier.toFixed(1)}x Demand</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={demandMultiplier}
                onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>3.0x (Festival)</span>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl space-y-2 border ${
                stockoutSimulation.isCritical
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Depletion Horizon
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    stockoutSimulation.isCritical
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {stockoutSimulation.isCritical ? "Restock Needed" : "Healthy Buffer"}
                </span>
              </div>

              <h4 className="font-black text-base text-white">
                {Number(stockoutSimulation.days) <= 1
                  ? `Exhaustion in ~${stockoutSimulation.hours} Hours`
                  : `Lasts ~${stockoutSimulation.days} Days`}
              </h4>

              <p className="text-[11px] leading-relaxed text-slate-300">
                {stockoutSimulation.summary}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 text-center border-t border-slate-900 pt-3">
            Realtime calculations update directly against live inventory and historical consumption.
          </div>
        </div>
      </div>
    </div>
  );
};