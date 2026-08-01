import React from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

export const OrdersPage: React.FC = () => {
  const { products } = useInventory();
  const lowStock = products.filter(p => p.currentStock <= p.reorderLevel);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Purchase Orders & Supplier Restock</h1>
          <p className="text-xs text-slate-500">Auto-generated supplier orders based on AI depletion predictions</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all">
          <Plus className="w-4 h-4" />
          <span>Create Draft PO</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">Recommended Auto-Draft Purchase Orders</h3>

        {lowStock.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">All Inventory Healthy</h4>
            <p className="text-xs text-slate-500">No items are currently below reorder levels.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStock.map((p) => (
              <div key={p.productId} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img src={p.image} alt={p.productName} className="w-10 h-10 rounded-lg object-cover bg-white p-1 border border-slate-200" />
                  <div>
                    <h4 className="font-bold text-slate-900">{p.productName}</h4>
                    <p className="text-slate-500 font-mono">Supplier: {p.supplier} • Lead Time: 2 Days</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-600 text-sm block">Reorder: {p.reorderQuantity} units</span>
                  <span className="text-[11px] text-slate-400">Current Stock: {p.currentStock} {p.unit}s</span>
                </div>

                <button className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs">
                  Dispatch Order
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};