import React, { useState, useMemo } from "react";
import { RealBarcodeScanner } from "../components/RealBarcodeScanner";
import { useInventory } from "../contexts/InventoryContext";
import { Product, CustomerLedgerItem, Customer } from "../types";
import { CustomerDetailPage } from "./CustomerDetailPage";
import {
  User,
  QrCode,
  CheckCircle2,
  Trash2,
  ShoppingBag,
  Search,
  MapPin,
  CreditCard,
  Banknote,
} from "lucide-react";

export const CustomerRecords: React.FC = () => {
  const {
    products = [],
    updateStock,
    customers = [],
    recordCustomerPurchase,
    recordSaleTransaction,
    settleCustomerUdhaar,
    scanBarcode
  } = useInventory();

  const [activeView, setActiveView] = useState<"NEW_ENTRY" | "RECORD_SUMMARY" | "UDHAAR_LIST">("NEW_ENTRY");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [creditLimit, setCreditLimit] = useState<number>(2000);
  const [paymentType, setPaymentType] = useState<"PAID" | "UDHAAR">("PAID");
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  // Settle Modal State
  const [settleModalCust, setSettleModalCust] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);

  const [customerCart, setCustomerCart] = useState<CustomerLedgerItem[]>([]);
  const [isScannerActive, setIsScannerActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setCustomerAddress(c.address || "");
    setCreditLimit(c.creditLimit || 2000);
    setMatchedCustomer(c);
  };

  const addProductToCart = (prod: Product) => {
    const price = Number(prod.sellingPrice || prod.mrp) || 14;

    setCustomerCart((prev) => {
      const idx = prev.findIndex((item) => item.productId === prod.productId);
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
          productId: prod.productId,
          productName: prod.productName,
          barcode: prod.barcode || "",
          quantity: 1,
          unitPrice: price,
          totalAmount: price
        }
      ];
    });

    setSuccessMessage(`+1 ${prod.productName}`);
    setTimeout(() => setSuccessMessage(null), 1200);
  };

  const handleScanSuccess = async (barcode: string) => {
    if (!barcode) return;
    const cleanCode = String(barcode).trim();
    let found = products.find((p) => String(p.barcode).trim() === cleanCode);
    if (!found && scanBarcode) {
      found = (await scanBarcode(cleanCode)) || undefined;
    }
    if (!found) {
      alert(`Barcode "${cleanCode}" not found in catalog.`);
      return;
    }
    addProductToCart(found);
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
      alert("Please enter customer name and add items to cart.");
      return;
    }

    if (paymentType === "UDHAAR") {
      const currentOutstanding = matchedCustomer?.currentUdhaar || 0;
      const allowedLimit = matchedCustomer?.creditLimit || creditLimit;
      if (currentOutstanding + totalBasketAmount > allowedLimit) {
        alert(
          `Udhaar Blocked! Limit is ₹${allowedLimit}. Current balance is ₹${currentOutstanding}. Remaining credit: ₹${Math.max(0, allowedLimit - currentOutstanding)}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await recordCustomerPurchase(
        customerName,
        customerPhone,
        totalBasketAmount,
        customerCart,
        paymentType,
        customerAddress,
        creditLimit
      );

      if (paymentType === "PAID" && recordSaleTransaction) {
        await recordSaleTransaction(customerName, totalBasketAmount, customerCart);
      }

      for (const item of customerCart) {
        await updateStock(item.productId, -Math.abs(item.quantity), "SALE");
      }

      setSuccessMessage(`Logged ₹${totalBasketAmount} (${paymentType}) for ${customerName}`);
      setCustomerCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setMatchedCustomer(null);
      setPaymentType("PAID");

      setTimeout(() => {
        setActiveView(paymentType === "UDHAAR" ? "UDHAAR_LIST" : "RECORD_SUMMARY");
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to commit record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalCust || repayAmount <= 0) return;

    try {
      await settleCustomerUdhaar(settleModalCust.customerId, repayAmount);
      setSuccessMessage(`Recorded ₹${repayAmount} repayment from ${settleModalCust.name}`);
      setSettleModalCust(null);
      setRepayAmount(0);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert("Settlement failed: " + err.message);
    }
  };

  const udhaarDebtors = useMemo(() => {
    return customers.filter((c) => (c.currentUdhaar || 0) > 0);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const list = activeView === "UDHAAR_LIST" ? udhaarDebtors : customers;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, udhaarDebtors, searchQuery, activeView]);

  if (selectedCustomer) {
    return (
      <CustomerDetailPage
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
      />
    );
  }

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto text-xs font-sans">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600 shrink-0" /> Customer Ledger & Udhaar Khata
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Track daily sales, cash payments, credit limits, and outstanding balances.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveView("NEW_ENTRY")}
            className={`flex-1 sm:flex-initial px-3 py-2 min-h-11 rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
              activeView === "NEW_ENTRY" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            + Scan & Bill
          </button>
          <button
            onClick={() => setActiveView("UDHAAR_LIST")}
            className={`flex-1 sm:flex-initial px-3 py-2 min-h-11 rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
              activeView === "UDHAAR_LIST" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            Udhaar ({udhaarDebtors.length})
          </button>
          <button
            onClick={() => setActiveView("RECORD_SUMMARY")}
            className={`flex-1 sm:flex-initial px-3 py-2 min-h-11 rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
              activeView === "RECORD_SUMMARY" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600"
            }`}
          >
            All ({customers.length})
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* VIEW 1: BILLING & SCANNING */}
      {activeView === "NEW_ENTRY" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" /> 1. Scan Barcode (Auto-Adds)
              </h3>
              <button
                type="button"
                onClick={() => setIsScannerActive(!isScannerActive)}
                className="text-[11px] font-bold text-slate-500 cursor-pointer min-h-9"
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
                value=""
                onChange={(e) => {
                  const p = products.find((x) => x.productId === e.target.value);
                  if (p) addProductToCart(p);
                }}
                className="w-full p-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl font-medium cursor-pointer"
              >
                <option value="">-- Click to Add Product to Cart --</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} (Stock: {p.currentStock}) - ₹{p.sellingPrice || p.mrp || 14}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Assignment & Payment Selection */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" /> 2. Customer & Payment Type
              </h3>

              {/* Payment Mode Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentType("PAID")}
                  className={`py-2 min-h-11 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    paymentType === "PAID"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Paid (Cash / UPI)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("UDHAAR")}
                  className={`py-2 min-h-11 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    paymentType === "UDHAAR"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Udhaar (Credit)
                </button>
              </div>

              {/* Customer Inputs */}
              <div className="relative">
                <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar..."
                  className="w-full p-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />

                {customerSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {customerSuggestions.map((c) => (
                      <div
                        key={c.customerId}
                        onClick={() => selectExistingCustomer(c)}
                        className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">{c.phone || "No phone"} • {c.address || "No address"}</p>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          Udhaar: ₹{c.currentUdhaar || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 Phone"
                    className="w-full p-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    min="500"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full p-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="e.g. Near Shiv Mandir, Ward 4"
                  className="w-full p-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {matchedCustomer && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-amber-900">
                    <span>Credit Limit: ₹{matchedCustomer.creditLimit || 2000}</span>
                    <span className="text-rose-700">Existing Udhaar: ₹{matchedCustomer.currentUdhaar || 0}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Available Credit: <strong>₹{Math.max(0, (matchedCustomer.creditLimit || 2000) - (matchedCustomer.currentUdhaar || 0))}</strong>
                  </p>
                </div>
              )}

              {/* Cart List */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 block">
                  Bill Items ({customerCart.reduce((s, i) => s + i.quantity, 0)} units):
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {customerCart.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Cart empty.</p>
                  ) : (
                    customerCart.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">₹{item.unitPrice} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            <button onClick={() => updateCartItemQuantity(item.productId, -1)} className="px-2 py-1 font-bold text-xs">-</button>
                            <span className="px-1.5 font-bold">{item.quantity}</span>
                            <button onClick={() => updateCartItemQuantity(item.productId, 1)} className="px-2 py-1 font-bold text-xs">+</button>
                          </div>
                          <span className="font-bold w-12 text-right">₹{item.totalAmount}</span>
                          <button onClick={() => setCustomerCart((p) => p.filter((i) => i.productId !== item.productId))} className="text-slate-400 hover:text-rose-600 p-1">
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
                <span className="font-semibold text-xs">Total ({paymentType}):</span>
                <span className={`text-base font-black ${paymentType === "UDHAAR" ? "text-rose-400" : "text-emerald-400"}`}>
                  ₹{totalBasketAmount}
                </span>
              </div>
              <button
                type="button"
                disabled={customerCart.length === 0 || !customerName.trim() || isSubmitting}
                onClick={handleFinalizeBill}
                className={`w-full py-3 min-h-11.5 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
                  paymentType === "UDHAAR" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {isSubmitting ? "Processing..." : `Record ${paymentType} for ${customerName || "Customer"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2 & 3: ALL CUSTOMERS & UDHAAR DEBTORS */}
      {(activeView === "RECORD_SUMMARY" || activeView === "UDHAAR_LIST") && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {activeView === "UDHAAR_LIST" ? "Outstanding Udhaar Ledger" : "All Registered Customers"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeView === "UDHAAR_LIST"
                  ? "Customers with pending balances. Settle balance to remove them from this list."
                  : "Customer directory with credit limits, lifetime spend, and address."}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, or address..."
                className="w-full pl-9 pr-3.5 py-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              {activeView === "UDHAAR_LIST" ? "No pending Udhaar! All accounts settled." : "No customers found."}
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (< md) */}
              <div className="block md:hidden space-y-3">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.customerId}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-200 font-black text-slate-700 flex items-center justify-center shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">{c.name}</h4>
                          <p className="text-[10px] text-slate-400">{c.phone || "No phone"} • {c.visitCount} visits</p>
                        </div>
                      </div>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${
                        (c.currentUdhaar || 0) > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        ₹{c.currentUdhaar || 0}
                      </span>
                    </div>

                    {c.address && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.address}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                      <span className="text-slate-500">Credit Limit: <strong>₹{c.creditLimit || 2000}</strong></span>
                      <div className="flex items-center gap-1.5">
                        {(c.currentUdhaar || 0) > 0 && (
                          <button
                            onClick={() => {
                              setSettleModalCust(c);
                              setRepayAmount(c.currentUdhaar);
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                          >
                            Settle
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1.5 bg-slate-900 active:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                        >
                          Khata →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Contact & Address</th>
                      <th className="py-3 px-3 text-center">Credit Limit</th>
                      <th className="py-3 px-3 text-right">Pending Udhaar</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCustomers.map((c) => (
                      <tr key={c.customerId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 font-bold flex items-center justify-center shrink-0">
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{c.name}</span>
                              <span className="text-[10px] text-slate-400">{c.visitCount} visits</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="text-slate-600">
                            <p>{c.phone || "No phone"}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {c.address || "No address stored"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                          ₹{c.creditLimit || 2000}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`font-black text-sm ${c.currentUdhaar > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            ₹{c.currentUdhaar || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {c.currentUdhaar > 0 && (
                              <button
                                onClick={() => {
                                  setSettleModalCust(c);
                                  setRepayAmount(c.currentUdhaar);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                              >
                                Settle Repayment
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedCustomer(c)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] shadow-xs cursor-pointer"
                            >
                              Open Khata
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Settle Repayment Modal */}
      {settleModalCust && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Settle Udhaar: {settleModalCust.name}</h3>
            <p className="text-xs text-slate-500">
              Outstanding Balance: <strong className="text-rose-600">₹{settleModalCust.currentUdhaar}</strong>
            </p>
            <form onSubmit={handleSettleSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Repayment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={settleModalCust.currentUdhaar}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value))}
                  className="w-full p-2.5 min-h-11 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModalCust(null)}
                  className="flex-1 py-2.5 min-h-11 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 min-h-11 bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Confirm Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};