import React from "react";
import { BarChart3, TrendingUp, ArrowUpRight, DollarSign, Package, Zap } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

export const AnalyticsPage: React.FC = () => {
  const { products } = useInventory();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Analytics & Kirana Performance</h1>
        <p className="text-xs text-slate-500">Sales velocity, stock turn rates, and margin trends</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500">Monthly Revenue Growth</span>
          <p className="text-2xl font-black text-slate-900">₹3,42,800</p>
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5" /> +28.4% YoY Growth
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500">Fastest Moving SKU</span>
          <p className="text-xl font-bold text-slate-900">Maggi 2-Min Noodles</p>
          <span className="text-xs font-bold text-indigo-600">32 packs/day avg velocity</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500">Inventory Turnover Ratio</span>
          <p className="text-2xl font-black text-emerald-600">8.4x</p>
          <span className="text-xs font-medium text-slate-500">Optimal Kirana benchmark</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">Category Revenue Contribution</h3>

        <div className="space-y-3 text-xs">
          {[
            { cat: "Instant Food (Maggi, Pasta)", pct: "38%", amount: "₹1,30,264", color: "bg-emerald-500" },
            { cat: "Dairy (Amul Milk, Butter)", pct: "26%", amount: "₹89,128", color: "bg-teal-500" },
            { cat: "Beverages (Coke, Sprite)", pct: "18%", amount: "₹61,704", color: "bg-indigo-500" },
            { cat: "Biscuits & Bakery (Parle-G)", pct: "12%", amount: "₹41,136", color: "bg-purple-500" },
            { cat: "Staples (Sunflower Oil, Flour)", pct: "6%", amount: "₹20,568", color: "bg-amber-500" }
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>{item.cat}</span>
                <span className="font-mono">{item.amount} ({item.pct})</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full ${item.color}`} style={{ width: item.pct }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
