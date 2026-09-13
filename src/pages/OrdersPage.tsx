import React, { useState } from "react";
import {
  Plus,
  CheckCircle2,
  PackageCheck,
  Send,
  Building2,
  X,
  Check
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { Product } from "../types";

export const OrdersPage: React.FC = () => {
  const { products, updateStock } = useInventory();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [orderQty, setOrderQty] = useState<number>(20);

  const lowStock = products.filter((p) => p.currentStock <= p.reorderLevel);

  // Inward received units into live inventory
  const handleInwardStock = async (product: Product, quantity: number) => {
    try {
      await updateStock(product.productId, quantity, "STOCK_IN");
      setSuccessMessage(`Inwarded +${quantity} units for ${product.productName}. Stock updated!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Stock inward error:", err);
      alert("Failed to inward stock. Check Firestore connection.");
    }
  };

  // WhatsApp Supplier PO Dispatch Link
  const handleDispatchWhatsApp = (product: Product, quantity: number) => {
    const text = encodeURIComponent(
      `*PURCHASE ORDER - Rajesh Kirana Store*\n\n` +
      `*Product:* ${product.productName}\n` +
      `*SKU / Barcode:* ${product.barcode || product.sku || "N/A"}\n` +
      `*Requested Quantity:* ${quantity} ${product.unit || "unit"}s\n` +
      `*Supplier:* ${product.supplier || "Direct Distributor"}\n\n` +
      `Please confirm delivery timeline. Thank you!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleCreateCustomPO = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.productId === selectedProductId);
    if (!prod) return;

    await handleInwardStock(prod, orderQty);
    setIsModalOpen(false);
    setSelectedProductId("");
    setOrderQty(20);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" /> Purchase Orders & Supplier Restock
          </h1>
          <p className="text-slate-500 mt-1">
            Auto-generated supplier orders, inwarding pipeline, and WhatsApp PO generation.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Manual PO</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Stockout / Restock Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recommended Supplier Restock Orders</h3>
            <p className="text-[11px] text-slate-500">
              Triggered automatically for products with stock below threshold.
            </p>
          </div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            {lowStock.length} Low Stock Items
          </span>
        </div>

        {lowStock.length === 0 ? (
          <div className="py-14 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">All Inventory Healthy</h4>
            <p className="text-slate-500 text-xs">All catalog SKUs are above reorder thresholds.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStock.map((p) => {
              const reorderAmt = Number(p.reorderQuantity) || 25;
              const safeMrp = Number(p.mrp) || 0;
              const safePurchasePrice = Number(p.purchasePrice) || 0;
              const safeSellingPrice = Number(p.sellingPrice) || 0;

              // Safe fallback chain for unit cost estimation
              const unitCost =
                safePurchasePrice > 0
                  ? safePurchasePrice
                  : safeMrp > 0
                  ? safeMrp * 0.8
                  : safeSellingPrice > 0
                  ? safeSellingPrice * 0.8
                  : 10;

              const costEstimate = reorderAmt * unitCost;

              return (
                <div
                  key={p.productId}
                  className="p-4 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.productName}
                        className="w-12 h-12 rounded-xl object-cover bg-white p-1 border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
                        {p.productName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{p.productName}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Supplier: <strong className="text-slate-700">{p.supplier || "Local Wholesaler"}</strong> • Barcode: {p.barcode || "N/A"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        <span>Current Stock: <strong className="text-rose-600 font-bold">{p.currentStock} {p.unit || "unit"}s</strong></span>
                        <span>Threshold: {p.reorderLevel} {p.unit || "unit"}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <div className="text-left md:text-right pr-2">
                      <span className="font-black text-emerald-700 text-sm block">
                        Order: +{reorderAmt} {p.unit || "unit"}s
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Est. Cost: ~₹{Math.round(costEstimate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDispatchWhatsApp(p, reorderAmt)}
                        className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        title="Send Purchase Order via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp PO</span>
                      </button>

                      <button
                        onClick={() => handleInwardStock(p, reorderAmt)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Directly receive and add stock to inventory"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Receive Stock</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual PO Inwarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Inward Stock / Create PO
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPO} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Product *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Product to Inward --</option>
                  {products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName} (Current: {p.currentStock} {p.unit || "unit"}s)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity to Inward *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedProductId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Record Inwarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};