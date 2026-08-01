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
  const [sku, setSku] = useState(initialBarcode ? `SKU-${initialBarcode.slice(-4)}` : "");
  const [category, setCategory] = useState("Instant Food");
  const [currentStock, setCurrentStock] = useState(30);
  const [reorderLevel, setReorderLevel] = useState(15);
  const [reorderQuantity, setReorderQuantity] = useState(50);
  const [unit, setUnit] = useState("pack");
  const [supplier, setSupplier] = useState("DistriLink Wholesale");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("https://lh3.googleusercontent.com/aida-public/AB6AXuD3_fMWQSt63-2rWpnfSBHi-KWH-4b3a-gGBk-jp3COgTwkAm7YNUCLnPXyiQsSTd4Qc1cCyme2Pr6ToWpS-dDkp4QFjmXw6T8L6Ym0hrTZ5gOlnl36wcmgtKVG5Mf1MsLdLwplXuM3TgJczUdW3xwqTGX0QZTa9PMsEYHuZsFy6-wFGDHXMyBgaP972pnNtqzpkOYWa6z5DVVq3zjliEZA6Ecuiws30zz6sCwlNvyOFK8KIczYP6jy9A");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !barcode) return;

    setSubmitting(true);
    try {
      await addProduct({
        productName,
        barcode,
        sku: sku || `SKU-${barcode.slice(-4)}`,
        category,
        currentStock: Number(currentStock),
        minimumStock: Math.floor(Number(reorderLevel) / 2),
        maximumStock: Number(reorderQuantity) * 3,
        reorderLevel: Number(reorderLevel),
        reorderQuantity: Number(reorderQuantity),
        unit,
        supplier,
        description: description || `${productName} Kirana Inventory Item`,
        image
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Add New Kirana SKU</h3>
              <p className="text-xs text-slate-500">Register new product in Firestore database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Tata Salt 1kg"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode *</label>
              <div className="relative">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="890..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="TATA-SLT-1K"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="pack">pack</option>
                <option value="bottle">bottle</option>
                <option value="pouch">pouch</option>
                <option value="kg">kg</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                min="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reorder Qty</label>
              <input
                type="number"
                min="1"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Supplier Name</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
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
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-2"
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
