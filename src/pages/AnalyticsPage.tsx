import React, { useMemo } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { TrendingUp, BarChart3, PackageCheck, Layers, ArrowUpRight, AlertCircle } from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { products = [], history = [], sales = [] } = useInventory();

  // Helper: Parse any Firestore timestamp or ISO date string safely
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

    // Map catalog products for instant O(1) lookup
    const productMap = new Map<string, { price: number; name: string; category: string; stock: number }>();
    let totalCurrentStock = 0;

    products.forEach((p) => {
      const price = Number(p.sellingPrice) || Number(p.mrp) || Number((p as any).price) || 14;
      const cat = p.category?.trim() || "General";
      const stock = Number(p.currentStock) || 0;
      productMap.set(p.productId, { price, name: p.productName, category: cat, stock });
      totalCurrentStock += stock;
    });

    let grossRevenue = 0;
    let monthlyTotalRevenue = 0;
    let totalUnitsSold = 0;
    const skuSalesMap: Record<string, { name: string; units: number; revenue: number }> = {};
    const categoryRevenueMap: Record<string, { revenue: number; units: number }> = {};

    // 1. Ingest receipts from the live Firestore 'sales' collection
    if (sales && sales.length > 0) {
      sales.forEach((receipt: any) => {
        const receiptDate = parseLogDate(receipt.soldAt || receipt.timestamp);
        const receiptTotal = Number(receipt.totalPrice) || 0;
        grossRevenue += receiptTotal;

        if (receiptDate && receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear) {
          monthlyTotalRevenue += receiptTotal;
        }

        const items = receipt.items || [];
        items.forEach((item: any) => {
          const qty = Number(item.quantity) || 1;
          const unitPrice = Number(item.unitPrice) || Number(item.price) || 14;
          const itemTotal = Number(item.total) || qty * unitPrice;
          totalUnitsSold += qty;

          const prod = productMap.get(item.productId);
          const catName = prod?.category || "General";
          const prodName = item.productName || prod?.name || "Kirana Item";

          // SKU totals
          if (!skuSalesMap[item.productId]) {
            skuSalesMap[item.productId] = { name: prodName, units: 0, revenue: 0 };
          }
          skuSalesMap[item.productId].units += qty;
          skuSalesMap[item.productId].revenue += itemTotal;

          // Category totals
          if (!categoryRevenueMap[catName]) {
            categoryRevenueMap[catName] = { revenue: 0, units: 0 };
          }
          categoryRevenueMap[catName].revenue += itemTotal;
          categoryRevenueMap[catName].units += qty;
        });
      });
    } else {
      // 2. Fallback: Parse inventory history if sales collection has not yet been populated
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
            price: 14,
            name: log.productName || log.productId,
            category: "General",
            stock: 0
          };

          const itemTotal = qty * details.price;
          grossRevenue += itemTotal;
          totalUnitsSold += qty;

          if (logDate && logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
            monthlyTotalRevenue += itemTotal;
          }

          if (!skuSalesMap[log.productId]) {
            skuSalesMap[log.productId] = { name: details.name, units: 0, revenue: 0 };
          }
          skuSalesMap[log.productId].units += qty;
          skuSalesMap[log.productId].revenue += itemTotal;

          const cat = details.category;
          if (!categoryRevenueMap[cat]) {
            categoryRevenueMap[cat] = { revenue: 0, units: 0 };
          }
          categoryRevenueMap[cat].revenue += itemTotal;
          categoryRevenueMap[cat].units += qty;
        }
      });
    }

    // Top moving product
    const sortedSKUs = Object.values(skuSalesMap).sort((a, b) => b.units - a.units);
    const topSKU = sortedSKUs[0] || { name: products[0]?.productName || "No sales logged", units: 0, revenue: 0 };
    const avgDailyVelocity = (topSKU.units / 7).toFixed(1);

    // Turnover ratio
    const turnoverRatio = totalCurrentStock > 0 ? (totalUnitsSold / totalCurrentStock).toFixed(1) : "0.0";

    // Category breakdown
    const allCategoriesTotalRevenue = Object.values(categoryRevenueMap).reduce((acc, curr) => acc + curr.revenue, 0);

    const categoryBreakdown = Object.entries(categoryRevenueMap)
      .map(([catName, data]) => {
        const pct = allCategoriesTotalRevenue > 0 ? Math.round((data.revenue / allCategoriesTotalRevenue) * 100) : 0;
        return {
          category: catName,
          revenue: data.revenue,
          units: data.units,
          pct: Math.max(5, pct),
          actualPct: pct
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    // Identify slow-moving / dead stock (products with zero sales)
    const deadStockProducts = products.filter((p) => !skuSalesMap[p.productId]);

    const colorPalette = [
      "bg-emerald-500",
      "bg-teal-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-amber-500",
      "bg-rose-500"
    ];

    return {
      grossRevenue,
      monthlyTotalRevenue: monthlyTotalRevenue || grossRevenue,
      topSKUName: topSKU.name,
      topSKUUnits: topSKU.units,
      avgDailyVelocity,
      turnoverRatio,
      categoryBreakdown,
      colorPalette,
      totalUnitsSold,
      deadStockProducts
    };
  }, [products, history, sales]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Analytics & Kirana Performance</h1>
        <p className="text-slate-500 mt-1">Live sales velocity, revenue trends, and inventory turnover ratios</p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-semibold text-slate-500">Monthly Revenue Stream</span>
          <div className="text-2xl font-black text-slate-900">
            ₹{analyticsData.monthlyTotalRevenue.toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Live Firestore sync
          </p>
        </div>

        {/* Metric 2: Fastest Moving SKU */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-semibold text-slate-500">Fastest Moving SKU</span>
          <div className="text-lg font-black text-slate-900 truncate">{analyticsData.topSKUName}</div>
          <p className="text-[11px] font-bold text-indigo-600">
            {analyticsData.topSKUUnits} units sold • ~{analyticsData.avgDailyVelocity} packs/day avg
          </p>
        </div>

        {/* Metric 3: Turnover Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-semibold text-slate-500">Inventory Turnover Ratio</span>
          <div className="text-2xl font-black text-emerald-600">{analyticsData.turnoverRatio}x</div>
          <p className="text-[10px] text-slate-400">
            {analyticsData.totalUnitsSold} total units cleared through checkout
          </p>
        </div>
      </div>

      {/* Category Revenue Contribution Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Category Revenue Contribution</h3>
            <p className="text-[11px] text-slate-500">Real-time revenue split across registered product categories</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{analyticsData.categoryBreakdown.length} Categories</span>
        </div>

        {analyticsData.categoryBreakdown.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            No sales records recorded yet. Complete customer checkouts to populate category insights.
          </div>
        ) : (
          <div className="space-y-4">
            {analyticsData.categoryBreakdown.map((item, idx) => {
              const barColor = analyticsData.colorPalette[idx % analyticsData.colorPalette.length];

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{item.category}</span>
                    <span className="text-slate-900 font-bold">
                      ₹{item.revenue.toLocaleString("en-IN")}{" "}
                      <span className="text-slate-400 font-normal">({item.actualPct}%)</span>
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slow Moving / Dead Stock Alert Panel */}
      {analyticsData.deadStockProducts.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Slow-Moving & Dead Stock Watch</h3>
                <p className="text-[11px] text-slate-500">Catalog items with zero checkouts recorded</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {analyticsData.deadStockProducts.length} Idle SKUs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {analyticsData.deadStockProducts.slice(0, 6).map((prod) => (
              <div
                key={prod.productId}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{prod.productName}</span>
                  <span className="text-[10px] text-slate-400">
                    Stock: {prod.currentStock} {prod.unit || "unit"}s
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">₹{prod.sellingPrice || prod.mrp || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};