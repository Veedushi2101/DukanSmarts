import React, { useState, useMemo } from "react";
import { RealBarcodeScanner } from "../components/RealBarcodeScanner";
import { useInventory } from "../contexts/InventoryContext";
import { Product, CustomerLedgerItem, Customer, CustomerPurchaseLog } from "../types";
import {
  User,
  QrCode,
  CheckCircle2,
  Plus,
  Trash2,
  ShoppingBag,
  Sparkles,
  Phone,
  Calendar,
  Clock,
  Search,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowLeft,
  Edit2,
  Check,
  X,
  Save,
  AlertTriangle
} from "lucide-react";

export const CustomerLedgerTab: React.FC = () => {
  const {
    products = [],
    updateStock,
    customers = [],
    recordCustomerPurchase,
    updateCustomerDetails,
    updateCustomerBill,
    recordSaleTransaction,
    scanBarcode
  } = useInventory();

  const [activeView, setActiveView] = useState<"NEW_ENTRY" | "LEDGER_SUMMARY">("NEW_ENTRY");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  // Dedicated Customer Detail View State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Profile Edit State (Inside Detail View)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Bill Edit State (Inside Detail View)
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [billDraft, setBillDraft] = useState<CustomerPurchaseLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Scan & Bill
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  const [customerCart, setCustomerCart] = useState<CustomerLedgerItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(14);

  const [isScannerActive, setIsScannerActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active customer object if detail view is selected
  const activeCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.customerId === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  const customerSuggestions = useMemo(() => {
    if (!customerName.trim() || matchedCustomer) return [];
    const query = customerName.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query))
    );
  }, [customerName, customers, matchedCustomer]);

  const selectExistingCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone || "");
    setMatchedCustomer(c);
  };

  // Manual Dropdown Picker Selection
  const handleSelectItem = (prod: Product) => {
    setSelectedProduct(prod);
    const validPrice = Number(prod.sellingPrice || (prod as any).price || prod.mrp) || 14;
    setItemPrice(validPrice);
    setQuantity(1);
  };

  // Async Direct Auto-Add & Increment on Camera Scan
  const handleScanSuccess = async (barcode: string) => {
    if (!barcode) return;
    const cleanCode = String(barcode).trim();

    // 1. Try local cache first, fallback to Firestore search
    let found = products.find((p) => String(p.barcode).trim() === cleanCode);
    if (!found && scanBarcode) {
      found = (await scanBarcode(cleanCode)) || undefined;
    }

    if (!found) {
      alert(`Barcode "${cleanCode}" not found in store catalog.`);
      return;
    }

    const price = Number(found.sellingPrice || (found as any).price || found.mrp) || 14;

    // 2. Directly add or increment in cart
    setCustomerCart((prev) => {
      const idx = prev.findIndex((item) => item.productId === found!.productId);

      if (idx > -1) {
        const updated = [...prev];
        const nextQty = updated[idx].quantity + 1;
        updated[idx] = {
          ...updated[idx],
          quantity: nextQty,
          totalAmount: nextQty * updated[idx].unitPrice
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: found!.productId,
          productName: found!.productName,
          barcode: found!.barcode || "",
          quantity: 1,
          unitPrice: price,
          totalAmount: price
        }
      ];
    });

    // Mirror to manual box
    setSelectedProduct(found);
    setItemPrice(price);

    setSuccessMessage(`+1 ${found.productName} in Cart`);
    setTimeout(() => setSuccessMessage(null), 1500);
  };

  // Manual "+ Add to Cart" button click from the preview card
  const handleAddItemToBasket = () => {
    if (!selectedProduct) return;
    const price = Number(itemPrice) > 0 ? Number(itemPrice) : 14;
    const qtyToAdd = Math.max(1, Number(quantity) || 1);
    const total = price * qtyToAdd;

    setCustomerCart((prev) => {
      const idx = prev.findIndex((item) => item.productId === selectedProduct.productId);
      if (idx > -1) {
        const updated = [...prev];
        const nextQty = updated[idx].quantity + qtyToAdd;
        updated[idx] = {
          ...updated[idx],
          quantity: nextQty,
          totalAmount: nextQty * updated[idx].unitPrice
        };
        return updated;
      }
      return [
        ...prev,
        {
          productId: selectedProduct.productId,
          productName: selectedProduct.productName,
          barcode: selectedProduct.barcode || "",
          quantity: qtyToAdd,
          unitPrice: price,
          totalAmount: total
        }
      ];
    });

    setSuccessMessage(`Added ${selectedProduct.productName} to Cart`);
    setSelectedProduct(null);
    setQuantity(1);
    setTimeout(() => setSuccessMessage(null), 1500);
  };

  const updateCartItemQuantity = (productId: string, delta: number) => {
    setCustomerCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0
              ? { ...item, quantity: nextQty, totalAmount: nextQty * item.unitPrice }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CustomerLedgerItem[]
    );
  };

  const totalBasketAmount = useMemo(() => {
    return customerCart.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [customerCart]);

  const handleFinalizeBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || customerCart.length === 0) {
      alert("Please enter customer name and add at least one product to cart.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (recordCustomerPurchase) {
        await recordCustomerPurchase(
          customerName,
          customerPhone,
          totalBasketAmount,
          customerCart
        );
      }

      if (recordSaleTransaction) {
        await recordSaleTransaction(
          customerName,
          totalBasketAmount,
          customerCart
        );
      }

      for (const item of customerCart) {
        await updateStock(item.productId, -Math.abs(item.quantity), "SALE");
      }

      setSuccessMessage(`Logged ₹${totalBasketAmount} for ${customerName}`);
      setCustomerCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setMatchedCustomer(null);
      setSelectedProduct(null);

      setTimeout(() => {
        setActiveView("LEDGER_SUMMARY");
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      console.error("Ledger commit failure:", err);
      alert(`Commit Failed: ${err?.message || "Check Firestore connection."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCustomerDetail = (cust: Customer) => {
    setSelectedCustomerId(cust.customerId);
    setEditName(cust.name);
    setEditPhone(cust.phone || "");
    setIsEditingProfile(false);
    setEditingBillId(null);
    setBillDraft(null);
  };

  const handleSaveCustomerProfile = async () => {
    if (!activeCustomer || !editName.trim()) return;
    setIsSaving(true);
    try {
      await updateCustomerDetails(activeCustomer.customerId, {
        name: editName.trim(),
        phone: editPhone.trim()
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingBill = (bill: CustomerPurchaseLog) => {
    setEditingBillId(bill.billId);
    setBillDraft(JSON.parse(JSON.stringify(bill)));
  };

  const updateDraftItem = (itemIdx: number, field: "quantity" | "unitPrice", val: number) => {
    if (!billDraft) return;
    const items = [...billDraft.items];
    const target = { ...items[itemIdx], [field]: Math.max(0, val) };
    target.totalAmount = target.quantity * target.unitPrice;
    items[itemIdx] = target;

    const newBillTotal = items.reduce((sum, it) => sum + it.totalAmount, 0);
    setBillDraft({
      ...billDraft,
      items,
      totalAmount: newBillTotal
    });
  };

  const removeDraftItem = (itemIdx: number) => {
    if (!billDraft) return;
    const items = billDraft.items.filter((_, i) => i !== itemIdx);
    const newBillTotal = items.reduce((sum, it) => sum + it.totalAmount, 0);
    setBillDraft({
      ...billDraft,
      items,
      totalAmount: newBillTotal
    });
  };

  const handleSaveBillChanges = async () => {
    if (!activeCustomer || !billDraft) return;
    setIsSaving(true);
    try {
      const history = activeCustomer.purchaseHistory || [];
      const updatedHistory = history.map((b) => (b.billId === billDraft.billId ? billDraft : b));
      await updateCustomerBill(activeCustomer.customerId, updatedHistory);
      setEditingBillId(null);
      setBillDraft(null);
    } catch (err) {
      console.error("Failed to update bill:", err);
      alert("Could not update bill items.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!activeCustomer || !window.confirm("Void and remove this entire receipt?")) return;
    setIsSaving(true);
    try {
      const history = (activeCustomer.purchaseHistory || []).filter((b) => b.billId !== billId);
      await updateCustomerBill(activeCustomer.customerId, history);
      if (editingBillId === billId) {
        setEditingBillId(null);
        setBillDraft(null);
      }
    } catch (err) {
      console.error("Delete bill failure:", err);
      alert("Failed to remove bill.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.favoriteProducts && c.favoriteProducts.some((p) => p.toLowerCase().includes(q)))
    );
  }, [customers, searchQuery]);

  // Customer Detail View
  if (activeCustomer) {
    const bills = activeCustomer.purchaseHistory || [];

    return (
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto text-xs font-sans">
        <button
          onClick={() => setSelectedCustomerId(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customer Ledger Table
        </button>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                {activeCustomer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                {isEditingProfile ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="font-black text-base px-2 py-1 border border-slate-300 rounded-lg text-slate-900 bg-slate-50"
                    />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 Phone"
                      className="block text-xs px-2 py-1 border border-slate-300 rounded-lg text-slate-700 bg-slate-50"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-xl font-black text-slate-900">{activeCustomer.name}</h1>
                    <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {activeCustomer.phone || "No phone registered"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditingProfile ? (
                <>
                  <button
                    onClick={handleSaveCustomerProfile}
                    disabled={isSaving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Save Details
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditName(activeCustomer.name);
                      setEditPhone(activeCustomer.phone || "");
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile Details
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lifetime Spend</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                ₹{activeCustomer.totalSpent.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Visits</span>
              <div className="text-lg font-black text-emerald-600 mt-0.5">
                {activeCustomer.visitCount} visits
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Visit Cadence</span>
              <div className="text-sm font-black text-indigo-700 mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {activeCustomer.visitIntervalDays ? `Every ~${activeCustomer.visitIntervalDays}d` : "New Customer"}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Last Active</span>
              <div className="text-xs font-bold text-slate-700 mt-1">
                {activeCustomer.lastVisit ? new Date(activeCustomer.lastVisit).toLocaleDateString("en-IN") : "Today"}
              </div>
            </div>
          </div>
        </div>

        {/* Historical Receipts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Historical Bills & Order Adjustment</h2>
              <p className="text-[11px] text-slate-500">
                Modify quantities, edit unit rates, or void receipts with real-time recalculations.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{bills.length} Bills on file</span>
          </div>

          {bills.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No detailed bills logged yet for {activeCustomer.name}.
            </div>
          ) : (
            <div className="space-y-4">
              {bills.slice().reverse().map((bill) => {
                const isEditing = editingBillId === bill.billId;
                const activeBillData = isEditing && billDraft ? billDraft : bill;

                const dateObj = new Date(bill.timestamp);
                const dateStr = dateObj.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                });
                const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                return (
                  <div
                    key={bill.billId}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isEditing ? "bg-amber-50/60 border-amber-300" : "bg-slate-50/70 border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {bill.billId}
                        </span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateStr}
                        </span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-emerald-700">
                          Total: ₹{activeBillData.totalAmount}
                        </span>

                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={handleSaveBillChanges}
                              disabled={isSaving}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" /> Save Changes
                            </button>
                            <button
                              onClick={() => {
                                setEditingBillId(null);
                                setBillDraft(null);
                              }}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingBill(bill)}
                              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer"
                              title="Edit quantities / prices"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBill(bill.billId)}
                              className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Void Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {activeBillData.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <span className="font-bold text-slate-900">{item.productName}</span>

                          {isEditing ? (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">Qty:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateDraftItem(idx, "quantity", Number(e.target.value))}
                                  className="w-14 p-1 bg-slate-50 border border-slate-300 rounded font-bold text-center"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-slate-400">₹/unit:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.unitPrice}
                                  onChange={(e) => updateDraftItem(idx, "unitPrice", Number(e.target.value))}
                                  className="w-16 p-1 bg-slate-50 border border-slate-300 rounded font-bold text-center text-emerald-600"
                                />
                              </div>
                              <span className="font-bold w-16 text-right">₹{item.totalAmount}</span>
                              <button
                                onClick={() => removeDraftItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 text-slate-600 font-medium">
                              <span>
                                {item.quantity} × ₹{item.unitPrice}
                              </span>
                              <span className="font-bold text-slate-900">₹{item.totalAmount}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" /> Customer Ledger & Purchase Cadence
          </h1>
          <p className="text-slate-500 mt-1">
            Track customer purchase history, dates, times, and exact items taken.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-bold">
          <button
            onClick={() => setActiveView("NEW_ENTRY")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeView === "NEW_ENTRY" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            + Scan & Bill
          </button>
          <button
            onClick={() => setActiveView("LEDGER_SUMMARY")}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeView === "LEDGER_SUMMARY" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            Customer Ledger Table ({customers.length})
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* VIEW 1: BILLING & SCANNING */}
      {activeView === "NEW_ENTRY" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" /> 1. Scan Barcode (Auto-Adds to Cart)
              </h3>
              <button
                type="button"
                onClick={() => setIsScannerActive(!isScannerActive)}
                className="text-[11px] font-bold text-slate-500 cursor-pointer"
              >
                {isScannerActive ? "Pause Camera" : "Start Camera"}
              </button>
            </div>

            {isScannerActive ? (
              <RealBarcodeScanner onScanSuccess={handleScanSuccess} scanMode="STOCK_OUT" className="w-full" />
            ) : (
              <div className="p-8 bg-slate-50 text-center text-slate-400 rounded-2xl border border-dashed border-slate-300">
                Camera paused. Click above to resume.
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-600 block mb-1">Or pick product manually:</label>
              <select
                value={selectedProduct?.productId || ""}
                onChange={(e) => {
                  const p = products.find((x) => x.productId === e.target.value);
                  if (p) handleSelectItem(p);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} (Stock: {p.currentStock}) - ₹{p.sellingPrice || 14}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Input & Cart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" /> 2. Customer Assignment
              </h3>

              <div className="relative">
                <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (matchedCustomer && e.target.value !== matchedCustomer.name) {
                      setMatchedCustomer(null);
                    }
                  }}
                  placeholder="Type name (e.g. Naina)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />

                {customerSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100">
                    {customerSuggestions.map((c) => (
                      <div
                        key={c.customerId}
                        onClick={() => selectExistingCustomer(c)}
                        className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.phone || "No phone"} • {c.visitCount} visits</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Repeat Customer
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {matchedCustomer && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Regular Customer: {matchedCustomer.name}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      Visit #{matchedCustomer.visitCount + 1}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Total Lifetime Spend: <strong className="text-slate-900">₹{matchedCustomer.totalSpent}</strong>
                    {matchedCustomer.visitIntervalDays ? (
                      <> • Visits every <strong className="text-indigo-700">~{matchedCustomer.visitIntervalDays} days</strong></>
                    ) : null}
                  </p>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Cart Items List */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">
                  Current Bill Items ({customerCart.reduce((sum, item) => sum + item.quantity, 0)} units):
                </span>
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {customerCart.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">
                      Cart empty. Show barcode to camera to add items!
                    </p>
                  ) : (
                    customerCart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-100 shadow-2xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            ₹{item.unitPrice} per unit
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <button
                              onClick={() => updateCartItemQuantity(item.productId, -1)}
                              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-1.5 font-black text-slate-900 text-xs">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartItemQuantity(item.productId, 1)}
                              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-black text-slate-900 w-14 text-right">
                            ₹{item.totalAmount}
                          </span>
                          <button
                            onClick={() =>
                              setCustomerCart((prev) =>
                                prev.filter((i) => i.productId !== item.productId)
                              )
                            }
                            className="text-slate-300 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-xl">
                <span className="font-semibold text-xs">Total Amount:</span>
                <span className="text-base font-black text-emerald-400">₹{totalBasketAmount}</span>
              </div>
              <button
                type="button"
                disabled={customerCart.length === 0 || !customerName.trim() || isSubmitting}
                onClick={handleFinalizeBill}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                {isSubmitting ? "Saving Bill..." : `Record Bill for ${customerName || "Customer"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MASTER DIRECTORY */}
      {activeView === "LEDGER_SUMMARY" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Registered Customer Master & History</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click a customer row to view line items, or click "Open Khata" for complete order editing.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, or item..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              No customer records found. Record a bill to create one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3 text-center">Visits</th>
                    <th className="py-3 px-3">Cadence</th>
                    <th className="py-3 px-3">Items Summary</th>
                    <th className="py-3 px-3 text-right">Lifetime Spent</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCustomers.map((c) => {
                    const isExpanded = expandedCustomerId === c.customerId;

                    return (
                      <React.Fragment key={c.customerId}>
                        <tr
                          onClick={() => setExpandedCustomerId(isExpanded ? null : c.customerId)}
                          className={`hover:bg-slate-50/80 transition-all cursor-pointer ${
                            isExpanded ? "bg-slate-50/90 font-medium" : ""
                          }`}
                        >
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-100 to-teal-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 border border-emerald-200">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{c.name}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  Last: {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-IN") : "Recent"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-medium text-slate-600">
                            {c.phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {c.phone}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic">No phone</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-[11px]">
                              {c.visitCount} visits
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            {c.visitIntervalDays && c.visitIntervalDays > 0 ? (
                              <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                Every ~{c.visitIntervalDays} days
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">First visit</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 max-w-xs">
                            {c.favoriteProducts && c.favoriteProducts.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {c.favoriteProducts.slice(0, 3).map((item, i) => (
                                  <span
                                    key={i}
                                    className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200"
                                  >
                                    {item}
                                  </span>
                                ))}
                                {c.favoriteProducts.length > 3 && (
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    +{c.favoriteProducts.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 italic">No items</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <span className="text-sm font-black text-slate-900 block">
                              ₹{c.totalSpent.toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openCustomerDetail(c)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] shadow-xs cursor-pointer"
                              >
                                Open Khata
                              </button>
                              <button
                                onClick={() => setExpandedCustomerId(isExpanded ? null : c.customerId)}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={7} className="p-4 border-b border-slate-200/80">
                              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                    <Receipt className="w-4 h-4 text-emerald-600" /> Chronological Receipts for {c.name}
                                  </h4>
                                  <button
                                    onClick={() => openCustomerDetail(c)}
                                    className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit Past Bills
                                  </button>
                                </div>

                                {c.purchaseHistory && c.purchaseHistory.length > 0 ? (
                                  <div className="space-y-2.5">
                                    {c.purchaseHistory.slice().reverse().map((bill, bIdx) => {
                                      const d = new Date(bill.timestamp);
                                      const dateStr = d.toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric"
                                      });
                                      const timeStr = d.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      });

                                      return (
                                        <div
                                          key={bIdx}
                                          className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2"
                                        >
                                          <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-3">
                                              <span className="font-extrabold text-slate-800 flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {dateStr}
                                              </span>
                                              <span className="text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" /> {timeStr}
                                              </span>
                                            </div>
                                            <span className="font-black text-emerald-700 text-xs">
                                              Bill Total: ₹{bill.totalAmount}
                                            </span>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                            {bill.items.map((item, iIdx) => (
                                              <div
                                                key={iIdx}
                                                className="bg-white p-2 rounded-lg border border-slate-200/80 flex items-center justify-between text-[11px]"
                                              >
                                                <span className="font-semibold text-slate-800">
                                                  {item.productName}
                                                </span>
                                                <span className="text-slate-500 font-bold">
                                                  {item.quantity}x @ ₹{item.unitPrice} = ₹{item.totalAmount}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="py-3 text-center text-slate-400 text-xs">
                                    No purchases logged for this customer yet.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};