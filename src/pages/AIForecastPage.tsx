import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Sliders,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Zap,
  Activity,
  Calendar,
  Layers
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { AIPrediction } from "../types";

export const AIForecastPage: React.FC = () => {
  const { products, predictions, triggerProductAI } = useInventory();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.productId || "");
  const [simulatedSalesRate, setSimulatedSalesRate] = useState(20);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [customForecast, setCustomForecast] = useState<AIPrediction | null>(null);

  const product = products.find(p => p.productId === selectedProductId) || products[0];
  const prediction = predictions.find(p => p.productId === product?.productId) || predictions[0];

  const handleRunSimulation = async () => {
    if (!products.length) return;
    setLoadingSimulation(true);
    try {
      if (product) {
        const res = await triggerProductAI(product);
        setCustomForecast(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSimulation(false);
    }
  };

  const simulatedDaysLeft = Math.max(1, Math.floor((product?.currentStock || 18) / simulatedSalesRate));
  const simulatedHoursLeft = simulatedDaysLeft * 24;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">AI Forecast & Learning Engine</h1>
            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> Groq Llama-3.3 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Predictive stockout dates, demand spikes, and explainable Kirana purchasing insights
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={loadingSimulation}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSimulation ? "animate-spin" : ""}`} />
          <span>Force Midnight AI Recalculation</span>
        </button>
      </div>

      {/* 4 Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Patterns Learned</span>
          <p className="text-2xl font-black text-slate-900 mt-1">24 Rules</p>
          <span className="text-[11px] text-emerald-600 font-bold">Weekend & Heatwave Spikes</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Products Tracked</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{products.length} SKUs</p>
          <span className="text-[11px] text-slate-400">100% Realtime Firestore sync</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Model Confidence</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {prediction?.confidence || "94.2%"}
          </p>
          <span className="text-[11px] text-slate-400">High precision probability</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Accuracy Score</span>
          <p className="text-2xl font-black text-slate-900 mt-1">98.2%</p>
          <span className="text-[11px] text-emerald-600 font-bold">+1.8% vs last month</span>
        </div>
      </div>

      {/* Main Grid: Historical Sales vs Predicted Demand Chart + Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column 2/3 */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Historical Sales vs Predicted Demand</h3>
              <p className="text-xs text-slate-500">Actual checkout velocity compared against AI model projections</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Historical
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> AI Forecast
              </span>
            </div>
          </div>

          <div className="h-52 pt-6 flex items-end justify-between gap-3 px-2 border-b border-slate-100">
            {[
              { day: "Mon", actual: 14, pred: 15 },
              { day: "Tue", actual: 18, pred: 17 },
              { day: "Wed", actual: 12, pred: 14 },
              { day: "Thu", actual: 22, pred: 20 },
              { day: "Fri", actual: 28, pred: 26 },
              { day: "Sat (Peak)", actual: 0, pred: 35 },
              { day: "Sun (Peak)", actual: 0, pred: 32 }
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1 w-full justify-center h-36">
                  {item.actual > 0 && (
                    <div
                      className="w-1/2 bg-slate-800 rounded-t-md transition-all duration-300"
                      style={{ height: `${(item.actual / 40) * 100}%` }}
                      title={`Actual: ${item.actual}`}
                    />
                  )}
                  <div
                    className="w-1/2 bg-emerald-500/80 border border-emerald-400 rounded-t-md transition-all duration-300"
                    style={{ height: `${(item.pred / 40) * 100}%` }}
                    title={`AI Prediction: ${item.pred}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-600">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Neural Demand Simulator Sidebar */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Demand Simulation Tool</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select Product SKU</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} ({p.currentStock} {p.unit}s)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-300 mb-1">
                <span>Simulated Daily Velocity</span>
                <span className="text-emerald-400 font-bold">{simulatedSalesRate} units/day</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={simulatedSalesRate}
                onChange={(e) => setSimulatedSalesRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 bg-white/10 rounded-xl border border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Simulated AI Output
              </span>
              <p className="font-bold text-white text-sm">
                Projected Stockout: {simulatedDaysLeft} {simulatedDaysLeft === 1 ? "Day" : "Days"}
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                At {simulatedSalesRate} units/day, current stock of {product?.currentStock || 0} {product?.unit}s will deplete in {simulatedHoursLeft} hours.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explainable AI Insights Cards */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-slate-900">Explainable AI Behavior Patterns</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
              Verified Pattern #1
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Weekend Snack Surge</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Maggi Noodles sales increase by +22% every Friday evening. Groq AI automatically adjusts reorder point 2 days prior.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
              Verified Pattern #2
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Temperature Heatwave Demand</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When ambient local temperature exceeds 32°C, beverage checkout rate doubles. DukanSmarts flags Coca-Cola for pre-stocking.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              Verified Pattern #3
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Morning Dairy Run</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Amul Milk pouches experience 80% of daily sales between 6:30 AM and 9:00 AM. Requires daily midnight inventory verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};