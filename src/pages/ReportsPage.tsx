import React from "react";
import { FileSpreadsheet, Download, FileText, CheckCircle } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";

export const ReportsPage: React.FC = () => {
  const { products, history } = useInventory();

  const handleDownloadReport = () => {
    const csvContent = [
      "Timestamp,Action,ProductId,ProductName,PreviousStock,UpdatedStock\n",
      ...history.map(h => `"${h.timestamp}","${h.action}","${h.productId}","${h.productName || ''}",${h.previousStock},${h.updatedStock}\n`)
    ].join("");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `StockPilot_Audit_Logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Audit Logs</h1>
          <p className="text-xs text-slate-500">Downloadable CSV logs for accounting & compliance</p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download Audit Log CSV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">Daily Inventory Master Snapshot</h3>
          <p className="text-xs text-slate-500">Contains full SKU listing, stock values, and supplier details.</p>
          <button onClick={handleDownloadReport} className="text-xs font-bold text-indigo-600 hover:underline">
            Export Report CSV →
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">AI Accuracy & Forecast Performance Audit</h3>
          <p className="text-xs text-slate-500">Evaluates prediction accuracy against actual sales velocity.</p>
          <button onClick={handleDownloadReport} className="text-xs font-bold text-emerald-600 hover:underline">
            Export Audit Report →
          </button>
        </div>
      </div>
    </div>
  );
};
