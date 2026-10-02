import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Package
} from "lucide-react";
import { useInventory } from "../contexts/InventoryContext";
import { Product } from "../types";
import { AddProductModal } from "../components/AddProductModal";

interface InventoryPageProps {
  onSelectProduct?: (product: Product) => void;
  searchTerm?: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  onSelectProduct = () => {},
  searchTerm: externalSearchTerm
}) => {
  const { products = [], history = [], updateStock, deleteProduct } = useInventory();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeSearch = (externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm).toLowerCase();
  const categories = ["All", "Staples", "Instant Food", "Dairy", "Beverage", "Biscuits", "Personal Care"];

  // Filtered Product List
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      (p.productName || "").toLowerCase().includes(activeSearch) ||
      (p.sku || "").toLowerCase().includes(activeSearch) ||
      (p.barcode || "").includes(activeSearch);
    return matchesCategory && matchesSearch;
  });

  // Calculate Store Metrics
  const totalStockValue = products.reduce(
    (acc, p) => acc + ((p.currentStock || 0) * (p.sellingPrice || p.mrp || 0)),
    0
  );
  const lowStockProducts = products.filter((p) => (p.currentStock || 0) <= (p.reorderLevel || 0));

  const parseLogDate = (raw: any): Date | null => {
    if (!raw) return null;
    if (typeof raw.toDate === "function") return raw.toDate();
    if (typeof raw.seconds === "number") return new Date(raw.seconds * 1000);
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySalesLogs = history.filter((item) => {
    const logDate = parseLogDate(item.timestamp);
    return logDate && logDate >= todayStart && (item.action === "SALE" || item.action === "STOCK_OUT");
  });

  const todaySalesValue = todaySalesLogs.reduce((sum, item) => {
    const prod = products.find((p) => p.productId === item.productId);
    const unitPrice = prod?.sellingPrice || prod?.mrp || 0;
    const qty =
      typeof item.previousStock === "number" && typeof item.updatedStock === "number"
        ? Math.abs(item.previousStock - item.updatedStock)
        : 1;
    return sum + (qty * unitPrice);
  }, 0);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Product ID,Barcode,SKU,Product Name,Category,Current Stock,Unit,Selling Price,Supplier,Last Updated Date,Last Updated Time\n"
    ];

    const rows = products.map((p) => {
      const d = parseLogDate(p.updatedAt || p.createdAt) || new Date();
      const dateStr = d.toLocaleDateString("en-IN");
      const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

      return `"${p.productId}","${p.barcode || ""}","${p.sku || ""}","${(p.productName || "").replace(/"/g, '""')}","${p.category || "General"}",${p.currentStock || 0},"${p.unit || "unit"}",${p.sellingPrice || 0},"${(p.supplier || "").replace(/"/g, '""')}","${dateStr}","${timeStr}"`;
    });

    const blob = new Blob(["\uFEFF" + headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Store_Inventory_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (window.confirm(`Delete ${product.productName} from your store inventory?`)) {
      await deleteProduct(product.productId);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto font-sans text-xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Inventory Management</h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Live SKU catalog, stock units, and safety levels</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {externalSearchTerm === undefined && (
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={internalSearchTerm}
                onChange={(e) => setInternalSearchTerm(e.target.value)}
                placeholder="Search name, SKU, barcode..."
                className="w-full sm:w-60 pl-9 pr-3.5 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={products.length === 0}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 4 Metric KPI Cards (2 Columns on Mobile, 4 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">Total Stock Value</span>
          <div className="text-base sm:text-2xl font-black text-slate-900 truncate">₹{totalStockValue.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400 truncate">{products.length} registered SKUs</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">Low Stock Warnings</span>
          <div className="text-base sm:text-2xl font-black text-amber-600 truncate">{lowStockProducts.length} Items</div>
          <p className="text-[10px] text-slate-400 truncate">At/below reorder limit</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">Catalog SKUs</span>
          <div className="text-base sm:text-2xl font-black text-indigo-600 truncate">{products.length} Products</div>
          <p className="text-[10px] text-slate-400 truncate">Active on file</p>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">Today's Sales Total</span>
          <div className="text-base sm:text-2xl font-black text-slate-900 truncate">₹{todaySalesValue.toLocaleString("en-IN")}</div>
          <p className="text-[10px] text-slate-400 truncate">{todaySalesLogs.length} checkout sales</p>
        </div>
      </div>

      {/* Horizontal Scrolling Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 min-h-[36px] rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              selectedCategory === cat
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MOBILE VIEW: Touch-Optimized Cards (< md breakpoint) */}
      <div className="block md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No matching products.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isLow = (p.currentStock || 0) <= (p.reorderLevel || 0);
            return (
              <div
                key={p.productId}
                onClick={() => onSelectProduct(p)}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 active:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
                      {p.productName}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                      {p.barcode ? `BC: ${p.barcode}` : `SKU: ${p.sku}`} • {p.category || "General"}
                    </p>
                  </div>
                  <span
                    className={`font-black text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                      isLow
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isLow ? "Low Stock" : "In Stock"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stock Level</span>
                    <span className="font-black text-sm text-slate-900">
                      {p.currentStock} {p.unit || "unit"}s
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Selling Price</span>
                    <span className="font-black text-sm text-emerald-700">
                      ₹{p.sellingPrice || p.mrp || 0}
                    </span>
                  </div>
                </div>

                {/* Touch-Friendly Action Bar */}
                <div
                  className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStock(p.productId, -1, "SALE")}
                      className="px-3.5 py-2 min-h-[44px] bg-slate-100 active:bg-slate-200 text-slate-800 font-black rounded-xl text-xs cursor-pointer flex items-center justify-center"
                    >
                      -1 Sale
                    </button>
                    <button
                      onClick={() => updateStock(p.productId, 1, "STOCK_IN")}
                      className="px-3.5 py-2 min-h-[44px] bg-emerald-50 active:bg-emerald-100 text-emerald-800 border border-emerald-200 font-black rounded-xl text-xs cursor-pointer flex items-center justify-center"
                    >
                      +1 Inward
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, p)}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 active:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer"
                    title="Delete SKU"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW: Full Data Table (>= md breakpoint) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="p-4">Product / SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Price</th>
                <th className="p-4">Reorder Level</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quick Stock Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No products in your store yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Add Product" above to log your first inventory item.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = (p.currentStock || 0) <= (p.reorderLevel || 0);

                  return (
                    <tr
                      key={p.productId}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectProduct(p)}
                    >
                      <td className="p-4">
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {p.productName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          SKU: {p.sku} • Barcode: {p.barcode || "N/A"}
                        </p>
                      </td>

                      <td className="p-4 font-medium text-slate-600">{p.category}</td>

                      <td className="p-4">
                        <span className="font-black text-sm text-slate-900">{p.currentStock}</span>{" "}
                        <span className="text-[11px] text-slate-500">{p.unit || "unit"}s</span>
                      </td>

                      <td className="p-4 font-bold text-slate-900">
                        ₹{(p.sellingPrice || p.mrp || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="p-4 text-slate-600">
                        {p.reorderLevel} {p.unit || "unit"}s
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center font-bold text-[10px] px-2.5 py-0.5 rounded-full ${
                            isLow
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => updateStock(p.productId, -1, "SALE")}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                            title="Quick Sale -1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => updateStock(p.productId, 1, "STOCK_IN")}
                            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg cursor-pointer"
                            title="Stock In +1"
                          >
                            +1
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, p)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg transition-colors cursor-pointer ml-1"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AddProductModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
};