import React, { useState } from "react";
import { X, ShoppingCart, Minus, Plus, CheckCircle2 } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

interface RecordSaleModalProps {
  onClose: () => void;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({ onClose }) => {
  const { products, recordSale } = useInventory();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.productId || "");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const product = products.find(p => p.productId === selectedProductId) || products[0];

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || quantity <= 0) return;

    setSubmitting(true);
    try {
      await recordSale(product.productId, quantity);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">POS Quick Checkout</h3>
              <p className="text-xs text-slate-500">Decrements stock & triggers AI forecast</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Sale Recorded & Synced!</h4>
            <p className="text-xs text-slate-500">
              Stock updated. AI forecasting engine re-evaluating demand in background...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRecord} className="space-y-4 mt-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setQuantity(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} ({p.currentStock} {p.unit}s left) - SKU: {p.sku}
                  </option>
                ))}
              </select>
            </div>

            {product && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                <img
                  src={product.image || "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=300"}
                  alt={product.productName}
                  className="w-12 h-12 rounded-lg object-cover bg-white p-1 border border-slate-200"
                />
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{product.productName}</p>
                  <p className="text-[11px] text-slate-500">Barcode: {product.barcode}</p>
                  <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                    Current Stock: {product.currentStock} {product.unit}s
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity Sold</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product?.currentStock || 100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product?.currentStock || 100, Number(e.target.value))))}
                  className="w-20 text-center py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product?.currentStock || 100, quantity + 1))}
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex justify-between items-center">
              <span>New Stock Level After Sale:</span>
              <span className="font-bold text-xs">
                {Math.max(0, (product?.currentStock || 0) - quantity)} {product?.unit}s
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (product?.currentStock || 0) < 1}
                className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Confirm & Complete Sale"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};