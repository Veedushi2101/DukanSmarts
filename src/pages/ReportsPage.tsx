import React from "react";
import { FileSpreadsheet, Download, FileText, BarChart2, CreditCard } from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { useAuth } from "../contexts/AuthContext";

export const ReportsPage: React.FC = () => {
  const { products = [], history = [], customers = [] } = useInventory();
  const { currentUser } = useAuth();

  const storeName = currentUser?.billHeaderName || currentUser?.storeName || "Store";
  const todayIso = new Date().toISOString().split("T")[0];

  const triggerDownload = (csvContent: string, fileName: string) => {
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // 1. Full Audit Trail Report (Includes Udhaar Issued and Repaid)
  const handleDownloadAuditLogs = () => {
    const headers = "Timestamp,Action,Reference ID,Description / Item,Previous Balance / Stock,Updated Balance / Stock,Delta\n";
    const rows = history.map((h) => {
      const delta = (h.updatedStock ?? 0) - (h.previousStock ?? 0);
      return `"${h.timestamp}","${h.action}","${h.productId}","${(h.productName || "").replace(/"/g, '""')}",${h.previousStock ?? 0},${h.updatedStock ?? 0},${delta}\n`;
    });
    triggerDownload(headers + rows.join(""), `${storeName}_Audit_Logs_${todayIso}.csv`);
  };

  // 2. Master Inventory Snapshot Report
  const handleDownloadInventorySnapshot = () => {
    const headers = "Barcode,SKU,Product Name,Category,Current Stock,Unit,Selling Price,MRP,Purchase Cost,Total Stock Value,Reorder Level,Supplier\n";
    const rows = products.map((p) => {
      const price = Number(p.sellingPrice || p.mrp || 0);
      const stock = Number(p.currentStock || 0);
      const value = stock * price;
      return `"${p.barcode || ""}","${p.sku || ""}","${(p.productName || "").replace(/"/g, '""')}","${p.category || "General"}",${stock},"${p.unit || "unit"}",${price},${Number(p.mrp || price)},${Number(p.purchasePrice || 0)},${value},${Number(p.reorderLevel || 5)},"${(p.supplier || "").replace(/"/g, '""')}"\n`;
    });
    triggerDownload(headers + rows.join(""), `${storeName}_Inventory_Master_${todayIso}.csv`);
  };

  // 3. Stockout & Restock Deficit Report
  const handleDownloadRestockAudit = () => {
    const headers = "Barcode,Product Name,Current Stock,Reorder Threshold,Reorder Batch Qty,Status,Deficit To Minimum\n";
    const rows = products.map((p) => {
      const stock = Number(p.currentStock || 0);
      const threshold = Number(p.reorderLevel || 5);
      const isLow = stock <= threshold;
      const deficit = isLow ? Math.max(0, threshold - stock) : 0;
      return `"${p.barcode || ""}","${(p.productName || "").replace(/"/g, '""')}",${stock},${threshold},${Number(p.reorderQuantity || 20)},"${isLow ? "RESTOCK_REQUIRED" : "HEALTHY"}",${deficit}\n`;
    });
    triggerDownload(headers + rows.join(""), `${storeName}_Restock_Audit_${todayIso}.csv`);
  };

  // 4. Udhaar Debtor & Outstanding Balance Ledger Report
  const handleDownloadUdhaarReport = () => {
    const headers = "Customer Name,Phone,Address,Credit Limit,Outstanding Udhaar,Available Credit,Lifetime Spent,Total Visits,Last Active\n";
    const rows = customers.map((c) => {
      const limit = Number(c.creditLimit || 2000);
      const udhaar = Number(c.currentUdhaar || 0);
      const remaining = Math.max(0, limit - udhaar);
      return `"${(c.name || "").replace(/"/g, '""')}","${c.phone || "N/A"}","${(c.address || "").replace(/"/g, '""')}",${limit},${udhaar},${remaining},${c.totalSpent || 0},${c.visitCount || 0},"${c.lastVisit || todayIso}"\n`;
    });
    triggerDownload(headers + rows.join(""), `${storeName}_Udhaar_Khata_Report_${todayIso}.csv`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Export Center</h1>
          <p className="text-slate-500 mt-1">Export structured accounting, inventory, and Udhaar khata logs for {storeName}</p>
        </div>

        <button
          onClick={handleDownloadAuditLogs}
          disabled={history.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download Master Audit Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inventory Master */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Inventory Master</h3>
            <p className="text-slate-500">Full catalogue stock counts, wholesale costs, retail pricing, and current asset valuations.</p>
          </div>
          <button
            onClick={handleDownloadInventorySnapshot}
            disabled={products.length === 0}
            className="text-indigo-600 hover:text-indigo-800 font-bold text-left cursor-pointer transition-colors pt-2 border-t border-slate-100"
          >
            Export Catalogue CSV →
          </button>
        </div>

        {/* Card 2: Restock Deficits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <BarChart2 className="w-6 h-6 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Restock Deficits</h3>
            <p className="text-slate-500">Itemized breakdown of items under reorder thresholds, critical deficits, and restock batches.</p>
          </div>
          <button
            onClick={handleDownloadRestockAudit}
            disabled={products.length === 0}
            className="text-amber-600 hover:text-amber-800 font-bold text-left cursor-pointer transition-colors pt-2 border-t border-slate-100"
          >
            Export Restock Audit CSV →
          </button>
        </div>

        {/* Card 3: Udhaar Khata Report */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <CreditCard className="w-6 h-6 text-rose-600" />
            <h3 className="font-bold text-sm text-slate-900">Udhaar Khata Ledger</h3>
            <p className="text-slate-500">Outstanding credit balances, customer addresses, contact numbers, and allocated credit limits.</p>
          </div>
          <button
            onClick={handleDownloadUdhaarReport}
            disabled={customers.length === 0}
            className="text-rose-600 hover:text-rose-800 font-bold text-left cursor-pointer transition-colors pt-2 border-t border-slate-100"
          >
            Export Udhaar Ledger CSV →
          </button>
        </div>

        {/* Card 4: Historical Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Audit Activity Trail</h3>
            <p className="text-slate-500">Transaction log tracking stock in/out, sales, Udhaar issuances, and cash repayments.</p>
          </div>
          <button
            onClick={handleDownloadAuditLogs}
            disabled={history.length === 0}
            className="text-emerald-600 hover:text-emerald-800 font-bold text-left cursor-pointer transition-colors pt-2 border-t border-slate-100"
          >
            Export Activity Trail CSV →
          </button>
        </div>
      </div>
    </div>
  );
};