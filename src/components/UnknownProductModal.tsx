import React from "react";
import { AlertCircle, Plus, RefreshCw, X } from "lucide-react";

interface UnknownProductModalProps {
  barcode: string;
  onClose: () => void;
  onCreateProduct: (barcode: string) => void;
  onScanAgain: () => void;
}

export const UnknownProductModal: React.FC<UnknownProductModalProps> = ({
  barcode,
  onClose,
  onCreateProduct,
  onScanAgain
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Unknown Barcode Detected</h3>
              <p className="text-xs text-slate-500">Not found in Kirana inventory database</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-sm text-slate-800 tracking-wider">
          Barcode: <span className="font-bold text-indigo-600">{barcode}</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          This scanned product barcode does not match any registered inventory items in your store. What would you like to do?
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => onCreateProduct(barcode)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Register New Product</span>
          </button>

          <button
            onClick={onScanAgain}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan Another Barcode</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 text-center font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};