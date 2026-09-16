import React, { useState } from "react";
import { Zap, CheckCircle2, Trash2, Plus, Minus, Check, X, Package } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { Product } from "../types";
import { RealBarcodeScanner } from "../components/RealBarcodeScanner";
import { UnknownProductModal } from "../components/UnknownProductModal";

interface StagedScanItem {
  product: Product;
  quantity: number;
  action: "STOCK_IN" | "STOCK_OUT";
}

interface QRScannerPageProps {
  onOpenAddProductModalWithBarcode?: (barcode: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const QRScannerPage: React.FC<QRScannerPageProps> = ({
  onSelectProduct = () => {}
}) => {
  const { scanBarcode, updateStock, addProduct } = useInventory();

  const [scanMode, setScanMode] = useState<"STOCK_IN" | "STOCK_OUT">("STOCK_IN");
  const [manualInput, setManualInput] = useState("");
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  const [stagedItems, setStagedItems] = useState<StagedScanItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Quick Registration Modal State
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [regBarcode, setRegBarcode] = useState("");
  const [regProductName, setRegProductName] = useState("");
  const [regCategory, setRegCategory] = useState("Staples");
  const [regSellingPrice, setRegSellingPrice] = useState<number>(20);
  const [regInitialStock, setRegInitialStock] = useState<number>(10);
  const [regUnit, setRegUnit] = useState("packet");
  const [isSubmittingNewProduct, setIsSubmittingNewProduct] = useState(false);

  const categories = ["Staples", "Instant Food", "Dairy", "Beverage", "Biscuits", "Personal Care"];

  // Barcode Detection & Auto-Increment Queueing
  const handleBarcodeDetected = async (barcodeToScan: string) => {
    if (!barcodeToScan) return;
    const cleanCode = barcodeToScan.trim();

    // 1. Check if SKU is already staged in active mode
    const existingIdx = stagedItems.findIndex(
      (item) => item.product.barcode === cleanCode && item.action === scanMode
    );

    if (existingIdx !== -1) {
      setStagedItems((prev) => {
        const updated = [...prev];
        const current = updated[existingIdx];
        updated[existingIdx] = {
          ...current,
          quantity: current.quantity + 1
        };
        return updated;
      });

      const productName = stagedItems[existingIdx].product.productName;
      setSyncSuccessMessage(`+1 ${productName} (Qty: ${stagedItems[existingIdx].quantity + 1})`);
      setTimeout(() => setSyncSuccessMessage(null), 1500);
      return;
    }

    // 2. Not in staging queue: Look up product in store catalog
    const found = await scanBarcode(cleanCode);

    if (found) {
      setStagedItems((prev) => [
        ...prev,
        { product: found, quantity: 1, action: scanMode }
      ]);
      setSyncSuccessMessage(`Added ${found.productName} to Queue`);
      setTimeout(() => setSyncSuccessMessage(null), 1500);
    } else {
      setUnknownBarcode(cleanCode);
    }
  };

  const updateStagedQuantity = (productId: string, action: "STOCK_IN" | "STOCK_OUT", delta: number) => {
    setStagedItems((prev) =>
      prev
        .map((item) => {
          if (item.product.productId === productId && item.action === action) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as StagedScanItem[]
    );
  };

  const removeStagedItem = (productId: string, action: "STOCK_IN" | "STOCK_OUT") => {
    setStagedItems((prev) => prev.filter((item) => !(item.product.productId === productId && item.action === action)));
  };

  const handleConfirmAndSync = async () => {
    if (stagedItems.length === 0) return;
    setIsSyncing(true);
    try {
      for (const item of stagedItems) {
        const delta = item.action === "STOCK_IN" ? item.quantity : -item.quantity;
        await updateStock(item.product.productId, delta, item.action);
      }
      setSyncSuccessMessage(`Successfully updated ${stagedItems.length} SKU(s) in Database!`);
      setStagedItems([]);
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regProductName.trim() || !regBarcode.trim()) return;

    setIsSubmittingNewProduct(true);
    try {
      const newProd = await addProduct({
        productName: regProductName.trim(),
        barcode: regBarcode.trim(),
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        category: regCategory,
        sellingPrice: Number(regSellingPrice) || 0,
        mrp: Number(regSellingPrice) || 0,
        purchasePrice: Math.round((Number(regSellingPrice) || 0) * 0.8),
        currentStock: Number(regInitialStock) || 0,
        unit: regUnit,
        reorderLevel: 5,
        reorderQuantity: 20,
        minimumStock: 2,
        maximumStock: 100,
        supplier: "Direct Counter Entry",
        description: "Registered via barcode scanner counter",
        image: ""
      });

      setStagedItems((prev) => [
        ...prev,
        { product: newProd, quantity: 1, action: scanMode }
      ]);

      setShowQuickAddModal(false);
      setRegProductName("");
      setRegBarcode("");
    } catch (err) {
      console.error("Failed to register scanned product:", err);
    } finally {
      setIsSubmittingNewProduct(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
            <Zap className="w-3.5 h-3.5" /> Scanner & Staging Queue
          </div>
          <h1 className="text-xl font-black text-slate-900">Live Camera Barcode Scanner</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
            <button
              onClick={() => setScanMode("STOCK_IN")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                scanMode === "STOCK_IN" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Stock In (+1)
            </button>
            <button
              onClick={() => setScanMode("STOCK_OUT")}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                scanMode === "STOCK_OUT" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Stock Out (-1)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <RealBarcodeScanner onScanSuccess={handleBarcodeDetected} scanMode={scanMode} />

          {/* Manual Input Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or enter GTIN / Barcode manually (e.g. 8901058000269)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
            />
            <button
              onClick={() => {
                if (manualInput.trim()) {
                  handleBarcodeDetected(manualInput.trim());
                  setManualInput("");
                }
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Staging Queue Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-full min-h-[440px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Scanned Items Queue</h3>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                {stagedItems.reduce((acc, curr) => acc + curr.quantity, 0)} Items
              </span>
            </div>

            {syncSuccessMessage && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncSuccessMessage}</span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 py-3">
              {stagedItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No items scanned yet.<br />Show barcode to camera!
                </div>
              ) : (
                stagedItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-2.5">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="truncate max-w-[140px] text-slate-800">{item.product.productName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.action === "STOCK_IN" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {item.action === "STOCK_IN" ? "+ Stock In" : "- Stock Out"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateStagedQuantity(item.product.productId, item.action, -1)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-slate-900 text-sm px-1">{item.quantity}</span>
                        <button onClick={() => updateStagedQuantity(item.product.productId, item.action, 1)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeStagedItem(item.product.productId, item.action)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleConfirmAndSync}
              disabled={stagedItems.length === 0 || isSyncing}
              className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSyncing ? "Syncing..." : "Confirm & Update Dashboard"}</span>
            </button>
          </div>
        </div>
      </div>

      {unknownBarcode && (
        <UnknownProductModal
          barcode={unknownBarcode}
          onClose={() => setUnknownBarcode(null)}
          onCreateProduct={(bc) => {
            setRegBarcode(bc);
            setUnknownBarcode(null);
            setShowQuickAddModal(true);
          }}
          onScanAgain={() => {
            setUnknownBarcode(null);
          }}
        />
      )}

      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Register Scanned Item</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Barcode: {regBarcode}</p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={regProductName}
                  onChange={(e) => setRegProductName(e.target.value)}
                  placeholder="e.g. Parle Hide & Seek 120g"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={regSellingPrice}
                    onChange={(e) => setRegSellingPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={regInitialStock}
                    onChange={(e) => setRegInitialStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    value={regUnit}
                    onChange={(e) => setRegUnit(e.target.value)}
                    placeholder="packet / bottle / kg"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewProduct}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {isSubmittingNewProduct ? "Saving..." : "Save & Queue Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};