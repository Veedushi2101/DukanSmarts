import React, { useState } from "react";
import { X, Plus, PackageCheck, QrCode } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

interface AddProductModalProps {
  initialBarcode?: string;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ initialBarcode = "", onClose }) => {
  const { addProduct } = useInventory();

  const [productName, setProductName] = useState("");
  const [barcode, setBarcode] = useState(initialBarcode);
  const [sku, setSku] = useState(initialBarcode ? `SKU-${initialBarcode.slice(-6)}` : "");
  const [category, setCategory] = useState("Instant Food");
  const [sellingPrice, setSellingPrice] = useState<number | "">(20);
  const [mrp, setMrp] = useState<number | "">(20);
  const [purchasePrice, setPurchasePrice] = useState<number | "">(16);
  const [currentStock, setCurrentStock] = useState<number | "">(25);
  const [reorderLevel, setReorderLevel] = useState<number | "">(10);
  const [reorderQuantity, setReorderQuantity] = useState<number | "">(50);
  const [unit, setUnit] = useState("pack");
  const [supplier, setSupplier] = useState("DistriLink Wholesale");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !barcode.trim()) {
      setError("Please provide both Product Name and Barcode.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const finalSellingPrice = Number(sellingPrice) || 0;
      const finalMrp = Number(mrp) || finalSellingPrice;
      const finalPurchasePrice = Number(purchasePrice) || Math.round(finalSellingPrice * 0.8);
      const stock = Number(currentStock) || 0;
      const minLevel = Number(reorderLevel) || 5;
      const reorderQty = Number(reorderQuantity) || 20;

      await addProduct({
        productName: productName.trim(),
        barcode: barcode.trim(),
        sku: sku.trim() || `SKU-${barcode.trim().slice(-6)}`,
        category,
        sellingPrice: finalSellingPrice,
        mrp: finalMrp,
        purchasePrice: finalPurchasePrice,
        currentStock: stock,
        minimumStock: Math.max(1, Math.floor(minLevel / 2)),
        maximumStock: reorderQty * 3,
        reorderLevel: minLevel,
        reorderQuantity: reorderQty,
        unit,
        supplier: supplier.trim() || "Wholesale Depot",
        description: description.trim() || `${productName.trim()} Dukaan SKU`,
        image: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=300"
      });

      onClose();
    } catch (err: any) {
      console.error("Failed to add product:", err);
      setError(err?.message || "Failed to save item. Check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto font-sans text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Add New Dukaan SKU</h3>
              <p className="text-slate-500 text-[11px]">Register new product in store inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Tata Salt 1kg"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode / GTIN *</label>
              <div className="relative">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => {
                    setBarcode(e.target.value);
                    if (!sku) setSku(`SKU-${e.target.value.slice(-6)}`);
                  }}
                  placeholder="890..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU Identifier</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-890123"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
              >
                <option value="Instant Food">Instant Food</option>
                <option value="Dairy">Dairy</option>
                <option value="Beverage">Beverage</option>
                <option value="Biscuits">Biscuits</option>
                <option value="Staples">Staples</option>
                <option value="Personal Care">Personal Care</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Type</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
              >
                <option value="pack">pack</option>
                <option value="bottle">bottle</option>
                <option value="pouch">pouch</option>
                <option value="kg">kg</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setSellingPrice(val);
                  if (mrp === "" || mrp < (Number(val) || 0)) setMrp(val);
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                min="0"
                value={mrp}
                onChange={(e) => setMrp(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reorder Limit</label>
              <input
                type="number"
                min="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reorder Qty</label>
              <input
                type="number"
                min="1"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Local Distributor"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? "Saving..." : "Save Product"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};