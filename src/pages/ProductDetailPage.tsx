import React, { useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Minus
} from "lucide-react";
import { Product } from "../types";
import { useInventory } from "../contexts/InventoryContext";

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onOpenSaleModal: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onOpenSaleModal
}) => {
  const { updateStock, predictions, history } = useInventory();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly">("daily");

  const prediction = predictions.find(p => p.productId === product.productId) || null;
  const productHistory = history.filter(h => h.productId === product.productId);

  const isLow = product.currentStock <= product.reorderLevel;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inventory Master</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateStock(product.productId, product.reorderQuantity, "STOCK_IN")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Stock-In +{product.reorderQuantity}</span>
          </button>
          <button
            onClick={onOpenSaleModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Minus className="w-4 h-4" />
            <span>Record POS Sale</span>
          </button>
        </div>
      </div>

      {/* Product Information Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={product.image}
            alt={product.productName}
            className="w-20 h-20 rounded-2xl object-cover bg-slate-50 p-1 border border-slate-200 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{product.productName}</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isLow ? "bg-rose-100 text-rose-800 border border-rose-200" : "bg-emerald-100 text-emerald-800"
              }`}>
                {isLow ? "Low Stock Alert" : "Healthy Stock"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              SKU: {product.sku} • Barcode: {product.barcode} • Category: {product.category}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supplier: <span className="text-slate-700 font-semibold">{product.supplier}</span>
            </p>
          </div>
        </div>

        {/* Current Stock Badge */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-right min-w-[180px]">
          <span className="text-xs font-semibold text-slate-500 block">Current Stock</span>
          <span className="text-3xl font-black text-slate-900">{product.currentStock}</span>
          <span className="text-xs font-bold text-slate-500 ml-1">{product.unit}s</span>
          <p className="text-[11px] text-slate-400 mt-0.5">Reorder Point: {product.reorderLevel} {product.unit}s</p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Current Stock</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{product.currentStock} {product.unit}s</p>
          <span className="text-[11px] text-slate-400">Min: {product.minimumStock} | Max: {product.maximumStock}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Sold Today</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">14 units</p>
          <span className="text-[11px] text-emerald-600 font-bold">+18% daily velocity</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Demand Level</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">High Velocity</p>
          <span className="text-[11px] text-slate-400">Weekend peak demand</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Reorder Point</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{product.reorderLevel} {product.unit}s</p>
          <span className="text-[11px] text-slate-400">Order qty: {product.reorderQuantity}</span>
        </div>
      </div>

      {/* Stock Pilot Glassmorphism Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">StockPilot AI Depletion Forecast</h3>
            <p className="text-xs text-slate-400">Groq Llama-3.3 Kirana Intelligence Model</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/10 space-y-3">
          <p className="text-sm font-bold text-white leading-relaxed">
            "{product.productName} stock is projected to deplete in {prediction?.daysRemaining ? prediction.daysRemaining * 24 : 48} hours."
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {prediction?.reasoning || `${product.productName} shows accelerated checkout frequency. Typical high-velocity weekend demand is starting early.`}
          </p>

          <div className="pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Confidence Score</span>
              <span className="font-bold text-emerald-400 text-sm">{prediction?.confidence || "94.2%"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Predicted Depletion Date</span>
              <span className="font-bold text-white text-sm">{prediction?.predictedOutOfStockDate || "Tomorrow Evening"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Recommended Order Qty</span>
              <span className="font-bold text-emerald-400 text-sm">{prediction?.recommendedOrder || product.reorderQuantity} units</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Supplier Lead Time</span>
              <span className="font-bold text-slate-200 text-sm">2 Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Sales Analysis Chart + Demand Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Historical Sales Analysis</h3>
              <p className="text-xs text-slate-500">Checkout velocity distribution over time</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTimeframe("daily")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  timeframe === "daily" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeframe("weekly")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  timeframe === "weekly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Fixed Chart Bars Container */}
          <div className="h-52 pt-6 flex items-end justify-between gap-3 px-2 border-b border-slate-100">
            {[14, 18, 12, 22, 28, 34, 19].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-[10px] font-bold text-slate-600">{val}</span>
                <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all duration-300"
                    style={{ height: `${Math.max(10, (val / 35) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demand Buying Peak Heatmap */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Hourly Buying Demand Heatmap</h3>
          <p className="text-xs text-slate-500">Peak customer buying hours</p>

          <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">8 AM - Low</div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 font-bold">12 PM - Med</div>
            <div className="p-2 bg-emerald-500 text-white rounded-lg font-bold shadow-xs">6 PM - Peak</div>
            <div className="p-2 bg-emerald-300 text-emerald-950 rounded-lg font-bold">8 PM - High</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Peak Sales Window: 6:00 PM - 8:30 PM</p>
            <p className="text-[11px] text-slate-500 mt-0.5">62% of Maggi purchases occur during evening snack hours.</p>
          </div>
        </div>
      </div>

      {/* Transaction Logs Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">Recent Transaction Logs</h3>
          <span className="text-xs text-slate-500 font-mono">
            Total {productHistory.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Previous Stock</th>
                <th className="p-3">Updated Stock</th>
                <th className="p-3">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                    No recent transactions recorded for this SKU yet. Scan or make a POS sale to generate audit logs!
                  </td>
                </tr>
              ) : (
                productHistory.map((h) => (
                  <tr key={h.historyId} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-600">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        h.action === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {h.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-semibold">{h.previousStock}</td>
                    <td className="p-3 text-slate-900 font-bold">{h.updatedStock}</td>
                    <td className="p-3 text-slate-500">{h.userId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};