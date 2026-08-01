import React, { useState } from "react";
import { Zap, CheckCircle2, Trash2, Plus, Minus, Check, Tag } from "lucide-react";
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
  onOpenAddProductModalWithBarcode: (barcode: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const QRScannerPage: React.FC<QRScannerPageProps> = ({
  onOpenAddProductModalWithBarcode,
  onSelectProduct
}) => {
  const { scanBarcode, updateStock, products } = useInventory();

  const [scanMode, setScanMode] = useState<"STOCK_IN" | "STOCK_OUT">("STOCK_IN");
  const [manualInput, setManualInput] = useState("");
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  const [stagedItems, setStagedItems] = useState<StagedScanItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Strict +1 queuing logic
  const handleBarcodeDetected = async (barcodeToScan: string) => {
    if (!barcodeToScan) return;
    const found = await scanBarcode(barcodeToScan);

    if (found) {
      setStagedItems((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.product.productId === found.productId && item.action === scanMode
        );

        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + 1 };
          return updated;
        } else {
          return [...prev, { product: found, quantity: 1, action: scanMode }];
        }
      });
    } else {
      setUnknownBarcode(barcodeToScan);
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
      setSyncSuccessMessage(`Successfully updated ${stagedItems.length} SKU(s) in Dashboard!`);
      setStagedItems([]);
      setTimeout(() => setSyncSuccessMessage(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
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
              className={`px-3.5 py-1.5 rounded-lg transition-all ${scanMode === "STOCK_IN" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Stock In (+1)
            </button>
            <button
              onClick={() => setScanMode("STOCK_OUT")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${scanMode === "STOCK_OUT" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Stock Out (-1)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <RealBarcodeScanner onScanSuccess={handleBarcodeDetected} scanMode={scanMode} />

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Or enter GTIN / Barcode manually (e.g. 8901058852312)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
            />
            <button
              onClick={() => {
                if (manualInput.trim()) {
                  handleBarcodeDetected(manualInput.trim());
                  setManualInput("");
                }
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Add Item
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Quick Scan Demo Products
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {products.slice(0, 6).map((item) => (
                <button
                  key={item.productId}
                  onClick={() => handleBarcodeDetected(item.barcode)}
                  className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-xl text-left transition-all"
                >
                  <span className="font-bold text-slate-800 block truncate">{item.productName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.barcode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
                        <button onClick={() => updateStagedQuantity(item.product.productId, item.action, -1)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-slate-900 text-sm px-1">{item.quantity}</span>
                        <button onClick={() => updateStagedQuantity(item.product.productId, item.action, 1)} className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeStagedItem(item.product.productId, item.action)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
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
              className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
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
            setUnknownBarcode(null);
            onOpenAddProductModalWithBarcode(bc);
          }}
          onScanAgain={() => {
            setUnknownBarcode(null);
          }}
        />
      )}
    </div>
  );
};