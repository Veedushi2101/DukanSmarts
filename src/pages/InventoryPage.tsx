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

  // Calculate Real Store Metrics
  const totalStockValue = products.reduce(
    (acc, p) => acc + (p.currentStock * (p.sellingPrice || p.mrp || 0)),
    0
  );
  const lowStockProducts = products.filter((p) => p.currentStock <= p.reorderLevel);

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

  // CSV Export with Clean Timestamps
  const handleExportCSV = () => {
    const headers = [
      "Product ID,Barcode,SKU,Product Name,Category,Current Stock,Unit,Selling Price,Supplier,Last Updated Date,Last Updated Time\n"
    ];

    const rows = products.map((p) => {
      const d = parseLogDate(p.updatedAt || p.createdAt) || new Date();
      const dateStr = d.toLocaleDateString("en-IN");
      const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

      return `"${p.productId}","${p.barcode}","${p.sku}","${(p.productName || "").replace(/"/g, '""')}","${p.category}",${p.currentStock},"${p.unit || "unit"}",${p.sellingPrice || 0},"${(p.supplier || "").replace(/"/g, '""')}","${dateStr}","${timeStr}"`;
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
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 mt-0.5">Your store's live item catalog and stock levels</p>
        </div>

        <div className="flex items-center gap-2">
          {externalSearchTerm === undefined && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={internalSearchTerm}
                onChange={(e) => setInternalSearchTerm(e.target.value)}
                placeholder="Search by name, SKU, or barcode..."
                className="pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          )}

          <button
            onClick={handleExportCSV}
            disabled={products.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 4 True Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Stock Value</span>
          <div className="text-2xl font-black text-slate-900">₹{totalStockValue.toLocaleString("en-IN")}</div>
          <p className="text-[11px] text-slate-400">{products.length} registered SKUs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Low Stock Warnings</span>
          <div className="text-2xl font-black text-amber-600">{lowStockProducts.length} Items</div>
          <p className="text-[11px] text-slate-400">Items at or below reorder limit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Catalog SKUs</span>
          <div className="text-2xl font-black text-indigo-600">{products.length} Products</div>
          <p className="text-[11px] text-slate-400">Scoped to your store account</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Today's Sales Total</span>
          <div className="text-2xl font-black text-slate-900">₹{todaySalesValue.toLocaleString("en-IN")}</div>
          <p className="text-[11px] text-slate-400">{todaySalesLogs.length} checkout sales today</p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main SKU Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                  const isLow = p.currentStock <= p.reorderLevel;

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
                          SKU: {p.sku} • Barcode: {p.barcode}
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
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                            title="Quick Sale -1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => updateStock(p.productId, 1, "STOCK_IN")}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg cursor-pointer"
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

      {/* Add Product Modal Component */}
      {isAddModalOpen && (
        <AddProductModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
};