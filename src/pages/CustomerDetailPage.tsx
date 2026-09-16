import React, { useState, useMemo } from "react";
import { Customer, CustomerPurchaseLog } from "../types";
import { useInventory } from "../contexts/InventoryContext";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Sparkles,
  Edit2,
  Check,
  X,
  Trash2,
  Receipt,
  Save,
  Clock
} from "lucide-react";

interface CustomerDetailPageProps {
  customer: Customer;
  onBack: () => void;
}

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({
  customer: initialCustomer,
  onBack
}) => {
  const { customers, updateCustomerDetails, updateCustomerBill } = useInventory();

  // Keep live customer reference from context
  const customer = useMemo(() => {
    return customers.find((c) => c.customerId === initialCustomer.customerId) || initialCustomer;
  }, [customers, initialCustomer]);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone || "");

  // Bill Edit State
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [billDraft, setBillDraft] = useState<CustomerPurchaseLog | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Save Customer Profile Changes
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      alert("Customer name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await updateCustomerDetails(customer.customerId, {
        name: editName.trim(),
        phone: editPhone.trim()
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Start Editing a Specific Bill
  const startEditingBill = (bill: CustomerPurchaseLog) => {
    setEditingBillId(bill.billId);
    setBillDraft(JSON.parse(JSON.stringify(bill)));
  };

  // Modify Draft Bill Item Quantity / Price
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

  // Delete an Item from the Draft Bill
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

  // Commit Bill Modifications
  const handleSaveBillChanges = async () => {
    if (!billDraft) return;
    setIsSaving(true);
    try {
      const history = customer.purchaseHistory || [];
      const updatedHistory = history.map((b) => (b.billId === billDraft.billId ? billDraft : b));
      await updateCustomerBill(customer.customerId, updatedHistory);
      setEditingBillId(null);
      setBillDraft(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update bill record.");
    } finally {
      setIsSaving(false);
    }
  };

  // Void / Delete Entire Bill
  const handleDeleteBill = async (billId: string) => {
    if (!window.confirm("Are you sure you want to void and remove this entire bill?")) return;
    setIsSaving(true);
    try {
      const history = (customer.purchaseHistory || []).filter((b) => b.billId !== billId);
      await updateCustomerBill(customer.customerId, history);
      if (editingBillId === billId) {
        setEditingBillId(null);
        setBillDraft(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove bill.");
    } finally {
      setIsSaving(false);
    }
  };

  const bills = customer.purchaseHistory || [];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto text-xs font-sans">
      {/* Top Back Action */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Customer Ledger
      </button>

      {/* Customer Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              {customer.name.slice(0, 2).toUpperCase()}
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
                  <h1 className="text-xl font-black text-slate-900">{customer.name}</h1>
                  <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {customer.phone || "No phone registered"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditingProfile ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Save Details
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditName(customer.name);
                    setEditPhone(customer.phone || "");
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
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* 4 Summary Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Lifetime Spend</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              ₹{customer.totalSpent.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Visits</span>
            <div className="text-lg font-black text-emerald-600 mt-0.5">
              {customer.visitCount} visits
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Visit Cadence</span>
            <div className="text-sm font-black text-indigo-700 mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {customer.visitIntervalDays ? `Every ~${customer.visitIntervalDays}d` : "New Customer"}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Active</span>
            <div className="text-xs font-bold text-slate-700 mt-1">
              {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString("en-IN") : "Today"}
            </div>
          </div>
        </div>
      </div>

      {/* Bill Records & Order Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900">Purchase Bills & Order Modification</h2>
            <p className="text-[11px] text-slate-500">
              Manage past receipts, adjust item quantities/prices, or delete incorrect bills.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">{bills.length} Bills on file</span>
        </div>

        {bills.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No bills logged for {customer.name} yet.
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
                    isEditing ? "bg-amber-50/50 border-amber-300" : "bg-slate-50/70 border-slate-200"
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
                            title="Edit Items / Prices"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill.billId)}
                            className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Void Entire Bill"
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
                              <span className="text-slate-400">₹/pack:</span>
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
};