import React, { useMemo } from "react";
import { useInventory } from "../contexts/InventoryContext";
import {
  TrendingUp,
  PackageCheck,
  AlertCircle,
  Flame,
  Clock,
  Skull
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { products = [], history = [], sales = [] } = useInventory();

  const parseLogDate = (rawTimestamp: any): Date | null => {
    if (!rawTimestamp) return null;
    if (typeof rawTimestamp.toDate === "function") return rawTimestamp.toDate();
    if (rawTimestamp.seconds) return new Date(rawTimestamp.seconds * 1000);
    const d = new Date(rawTimestamp);
    return isNaN(d.getTime()) ? null : d;
  };

  const analyticsData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const productMap = new Map<string, { price: number; cost: number; name: string; category: string; stock: number }>();
    let totalCurrentStock = 0;

    products.forEach((p) => {
      const price = Number(p.sellingPrice || p.mrp || 0);
      const cost = Number(p.purchasePrice || (price > 0 ? price * 0.8 : 0));
      const cat = p.category?.trim() || "General";
      const stock = Number(p.currentStock || 0);
      productMap.set(p.productId, { price, cost, name: p.productName, category: cat, stock });
      totalCurrentStock += stock;
    });

    let grossRevenue = 0;
    let monthlyTotalRevenue = 0;
    let totalEstimatedCost = 0;
    let totalUnitsSold = 0;
    const skuSalesMap: Record<string, { name: string; units: number; revenue: number; cost: number }> = {};
    const categoryRevenueMap: Record<string, { revenue: number; units: number }> = {};

    // 1. Ingest sales records
    if (sales && sales.length > 0) {
      sales.forEach((receipt: any) => {
        const receiptDate = parseLogDate(receipt.timestamp || receipt.soldAt);
        const receiptTotal = Number(receipt.totalAmount || receipt.totalPrice || 0);
        grossRevenue += receiptTotal;

        if (receiptDate && receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear) {
          monthlyTotalRevenue += receiptTotal;
        }

        const items = receipt.items || [];
        items.forEach((item: any) => {
          const qty = Number(item.quantity || 1);
          const unitPrice = Number(item.unitPrice || item.price || 0);
          const itemTotal = Number(item.totalAmount || item.total || qty * unitPrice);
          totalUnitsSold += qty;

          const prod = productMap.get(item.productId);
          const catName = prod?.category || "General";
          const prodName = item.productName || prod?.name || "Inventory Item";
          const unitCost = prod?.cost || unitPrice * 0.8;
          totalEstimatedCost += unitCost * qty;

          if (!skuSalesMap[item.productId]) {
            skuSalesMap[item.productId] = { name: prodName, units: 0, revenue: 0, cost: 0 };
          }
          skuSalesMap[item.productId].units += qty;
          skuSalesMap[item.productId].revenue += itemTotal;
          skuSalesMap[item.productId].cost += unitCost * qty;

          if (!categoryRevenueMap[catName]) {
            categoryRevenueMap[catName] = { revenue: 0, units: 0 };
          }
          categoryRevenueMap[catName].revenue += itemTotal;
          categoryRevenueMap[catName].units += qty;
        });
      });
    } else {
      // 2. Fallback: Parse inventory history
      history.forEach((log: any) => {
        const action = String(log.action || "").toUpperCase();
        if (action === "SALE" || action === "STOCK_OUT") {
          const logDate = parseLogDate(log.timestamp);
          let qty = 0;
          if (typeof log.previousStock === "number" && typeof log.updatedStock === "number") {
            qty = Math.abs(log.previousStock - log.updatedStock);
          } else {
            qty = Math.abs(log.quantityChange || log.qty || log.stockDelta || 1);
          }

          const details = productMap.get(log.productId) || {
            price: 0,
            cost: 0,
            name: log.productName || log.productId,
            category: "General",
            stock: 0
          };

          const itemTotal = qty * details.price;
          grossRevenue += itemTotal;
          totalUnitsSold += qty;
          totalEstimatedCost += details.cost * qty;

          if (logDate && logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
            monthlyTotalRevenue += itemTotal;
          }

          if (!skuSalesMap[log.productId]) {
            skuSalesMap[log.productId] = { name: details.name, units: 0, revenue: 0, cost: 0 };
          }
          skuSalesMap[log.productId].units += qty;
          skuSalesMap[log.productId].revenue += itemTotal;
          skuSalesMap[log.productId].cost += details.cost * qty;

          const cat = details.category;
          if (!categoryRevenueMap[cat]) {
            categoryRevenueMap[cat] = { revenue: 0, units: 0 };
          }
          categoryRevenueMap[cat].revenue += itemTotal;
          categoryRevenueMap[cat].units += qty;
        }
      });
    }

    const sortedSKUs = Object.values(skuSalesMap).sort((a, b) => b.units - a.units);
    const topSKU = sortedSKUs[0] || { name: products[0]?.productName || "No sales logged", units: 0, revenue: 0 };
    const avgDailyVelocity = (topSKU.units / 7).toFixed(1);

    const turnoverRatio = totalCurrentStock > 0 ? (totalUnitsSold / totalCurrentStock).toFixed(1) : "0.0";
    const grossMarginPct = grossRevenue > 0 ? Math.max(0, Math.round(((grossRevenue - totalEstimatedCost) / grossRevenue) * 100)) : 0;

    // 3. SEGREGATE INTO 3 WATCH TIERS:
    // A) High-Moving Stock: units sold >= 3
    const highMovingStock = products
      .filter((p) => (skuSalesMap[p.productId]?.units || 0) >= 3)
      .map((p) => ({
        ...p,
        unitsSold: skuSalesMap[p.productId]?.units || 0,
        revenueGenerated: skuSalesMap[p.productId]?.revenue || 0
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    // B) Idle Stock: units sold between 1 and 2
    const idleStock = products
      .filter((p) => {
        const sold = skuSalesMap[p.productId]?.units || 0;
        return sold > 0 && sold < 3;
      })
      .map((p) => ({
        ...p,
        unitsSold: skuSalesMap[p.productId]?.units || 0,
        lockedCapital: (p.currentStock || 0) * (p.purchasePrice || p.sellingPrice || 0)
      }));

    // C) Dead Stock: exactly 0 units sold
    const deadStock = products
      .filter((p) => !skuSalesMap[p.productId] || skuSalesMap[p.productId].units === 0)
      .map((p) => ({
        ...p,
        unitsSold: 0,
        lockedCapital: (p.currentStock || 0) * (p.purchasePrice || p.sellingPrice || 0)
      }));

    const deadStockLockedCapital = deadStock.reduce((sum, p) => sum + p.lockedCapital, 0);

    return {
      monthlyTotalRevenue: monthlyTotalRevenue || grossRevenue,
      topSKUName: topSKU.name,
      topSKUUnits: topSKU.units,
      avgDailyVelocity,
      turnoverRatio,
      grossMarginPct,
      totalUnitsSold,
      highMovingStock,
      idleStock,
      deadStock,
      deadStockLockedCapital
    };
  }, [products, history, sales]);

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto font-sans text-xs">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
          Analytics & Stock Velocity Watch
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
          Live financial turnover and 3-Tier inventory lifecycle monitoring
        </p>
      </div>

      {/* Top 4 KPI Cards: 2 Columns on Mobile, 4 Columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
            Monthly Revenue
          </span>
          <div className="text-lg sm:text-2xl font-black text-slate-900 truncate">
            ₹{analyticsData.monthlyTotalRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 truncate">
            <TrendingUp className="w-3 h-3" /> Live Sync
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
            Gross Margin
          </span>
          <div className="text-lg sm:text-2xl font-black text-indigo-600">
            {analyticsData.grossMarginPct}%
          </div>
          <p className="text-[10px] text-slate-400 truncate">Wholesale markup</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
            Fastest Moving
          </span>
          <div className="text-sm sm:text-lg font-black text-slate-900 truncate">
            {analyticsData.topSKUName}
          </div>
          <p className="text-[10px] font-bold text-emerald-600 truncate">
            {analyticsData.topSKUUnits} sold (~{analyticsData.avgDailyVelocity}/d)
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-1 sm:space-y-2">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
            Turnover Ratio
          </span>
          <div className="text-lg sm:text-2xl font-black text-slate-900">
            {analyticsData.turnoverRatio}x
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {analyticsData.totalUnitsSold} units cleared
          </p>
        </div>
      </div>

      {/* 3-TIER STOCK MONITORING SECTION */}
      <div className="space-y-4 sm:space-y-6">
        {/* Tier 1: High Moving Stock Watch */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  1. High-Moving Stock Watch (Fast Sellers)
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Velocity items driving store cash flow
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-lg border border-emerald-200 whitespace-nowrap">
              {analyticsData.highMovingStock.length} SKUs
            </span>
          </div>

          {analyticsData.highMovingStock.length === 0 ? (
            <p className="py-6 text-center text-slate-400 text-xs">
              No items with 3+ sales recorded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {analyticsData.highMovingStock.map((prod) => (
                <div
                  key={prod.productId}
                  className="p-3 sm:p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 flex justify-between items-center gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 block truncate">
                      {prod.productName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {prod.currentStock} {prod.unit || "unit"}s remaining
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-700 block">
                      {prod.unitsSold} Sold
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">
                      ₹{prod.revenueGenerated}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tier 2: Idle Stock Watch */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  2. Idle Stock Watch (Slow Turnover)
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Sold 1–2 units; demand is sluggish
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 px-2 sm:px-2.5 py-1 rounded-lg border border-amber-200 whitespace-nowrap">
              {analyticsData.idleStock.length} SKUs
            </span>
          </div>

          {analyticsData.idleStock.length === 0 ? (
            <p className="py-6 text-center text-slate-400 text-xs">
              No slow-moving products in this band.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {analyticsData.idleStock.map((prod) => (
                <div
                  key={prod.productId}
                  className="p-3 sm:p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 flex justify-between items-center gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 block truncate">
                      {prod.productName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Stock: {prod.currentStock} {prod.unit || "unit"}s
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-amber-800 block">
                      {prod.unitsSold} Sold
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ₹{prod.lockedCapital} tied
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tier 3: Dead Stock Watch */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <Skull className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  3. Dead Stock Watch (Zero Sales)
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  0 checkouts recorded holding down working capital
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] sm:text-xs font-bold text-rose-700 bg-rose-50 px-2 sm:px-2.5 py-1 rounded-lg border border-rose-200">
                ₹{analyticsData.deadStockLockedCapital.toLocaleString("en-IN")} Locked
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200">
                {analyticsData.deadStock.length} Dead SKUs
              </span>
            </div>
          </div>

          {analyticsData.deadStock.length === 0 ? (
            <p className="py-6 text-center text-slate-400 text-xs">
              Every catalog item has recorded at least 1 sale!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {analyticsData.deadStock.map((prod) => (
                <div
                  key={prod.productId}
                  className="p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 block truncate">
                      {prod.productName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Stock: {prod.currentStock} {prod.unit || "unit"}s
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-bold text-slate-900 block">
                      ₹{prod.sellingPrice || prod.mrp || 0}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600">
                      ₹{prod.lockedCapital} tied up
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};