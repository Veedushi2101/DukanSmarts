import React, { useState } from "react";
import { 
  Store, 
  Receipt, 
  CreditCard, 
  Download, 
  Save, 
  CheckCircle2, 
  Phone,
  AlertTriangle,
  Trash2,
  Lock,
  KeyRound
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const SettingsPage: React.FC = () => {
  const { currentUser, updateOwnerProfile, deleteAccount } = useAuth();

  // Shop Details
  const [storeName, setStoreName] = useState(currentUser?.storeName || "");
  const [billHeaderName, setBillHeaderName] = useState(currentUser?.billHeaderName || currentUser?.storeName || "");
  const [ownerName, setOwnerName] = useState(currentUser?.name || "");
  const [ownerPhone, setOwnerPhone] = useState(currentUser?.phone || "+91 ");
  const [storeAddress, setStoreAddress] = useState(currentUser?.address || "");

  // Preferences
  const [printReceipts, setPrintReceipts] = useState(true);
  const [scannerSound, setScannerSound] = useState(true);
  const [maxCreditLimit, setMaxCreditLimit] = useState(2000);
  const [lowStockLimit, setLowStockLimit] = useState(5);

  // Verification Modal State for Sensitive Changes
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);

  // Danger Zone / Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [savedStatus, setSavedStatus] = useState(false);

  // Handle standard saving vs OTP-protected changes
  const handleSaveAttempt = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameChanged = ownerName.trim() !== (currentUser?.name || "");
    const phoneChanged = ownerPhone.trim() !== (currentUser?.phone || "");

    const payload = {
      name: ownerName.trim(),
      phone: ownerPhone.trim(),
      storeName: storeName.trim(),
      billHeaderName: billHeaderName.trim(),
      address: storeAddress.trim()
    };

    // If owner name or phone number changed, require verification OTP
    if (nameChanged || phoneChanged) {
      setPendingUpdate(payload);
      setShowOtpModal(true);
      return;
    }

    await executeProfileUpdate(payload);
  };

  const executeProfileUpdate = async (data: any) => {
    try {
      await updateOwnerProfile(data);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyOtpAndSave = async () => {
    // Demonstration verification code: 123456
    if (enteredOtp.trim() !== "123456") {
      setOtpError("Invalid verification code. Please enter 123456 for demo.");
      return;
    }
    setOtpError("");
    setShowOtpModal(false);
    setEnteredOtp("");
    if (pendingUpdate) {
      await executeProfileUpdate(pendingUpdate);
      setPendingUpdate(null);
    }
  };

  const handleDeleteAccount = async () => {
    const requiredPhrase = currentUser?.storeName || "DELETE";
    if (deleteConfirmationText.trim() !== requiredPhrase) {
      setDeleteError(`Please type "${requiredPhrase}" to confirm.`);
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteAccount();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete account. You may need to re-login.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto font-sans text-xs">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dukaan Settings</h1>
          <p className="text-slate-500 mt-0.5">
            Manage your store information, billing counter, and security rules.
          </p>
        </div>
        <button
          onClick={handleSaveAttempt}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          {savedStatus ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedStatus ? "Changes Saved!" : "Save Settings"}</span>
        </button>
      </div>

      <form onSubmit={handleSaveAttempt} className="space-y-5">
        {/* 1. Shop Info & Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">1. Shop & Printed Bill Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Owner Full Name (OTP protected)
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Owner Phone Number (OTP protected)
              </label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Dukaan / Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Name Printed on Invoices</label>
              <input
                type="text"
                value={billHeaderName}
                onChange={(e) => setBillHeaderName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">Shop Address</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 2. Counter & Billing (Exact Rupee Rules Only) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">2. Counter & Exact Billing Preferences</h2>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900 block">Exact Rupee Billing Active</span>
                <span className="text-emerald-700 text-[11px]">
                  Bills calculate exact rupee & paise amounts with zero auto-rounding.
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-200/80 text-emerald-900 font-bold rounded-lg text-[10px]">
                Exact Total
              </span>
            </div>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Print Receipts Automatically</span>
                <span className="text-slate-500 text-[11px]">
                  Automatically open the print invoice dialog upon completing sale
                </span>
              </div>
              <input
                type="checkbox"
                checked={printReceipts}
                onChange={(e) => setPrintReceipts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Beep sound on Barcode Scan</span>
                <span className="text-slate-500 text-[11px]">Audio chime when items are recognized</span>
              </div>
              <input
                type="checkbox"
                checked={scannerSound}
                onChange={(e) => setScannerSound(e.target.checked)}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>
          </div>
        </div>

        {/* 3. Udhaar & Stock Limits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">3. Customer Credit & Stock Limits</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Max Udhaar Per Customer</label>
              <input
                type="number"
                value={maxCreditLimit}
                onChange={(e) => setMaxCreditLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Low Stock Warning Alert Level</label>
              <input
                type="number"
                value={lowStockLimit}
                onChange={(e) => setLowStockLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* 4. GitHub-Style Danger Zone */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="font-bold text-sm">Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <span className="font-bold text-slate-900 block">Delete This Shop & Account</span>
              <span className="text-slate-500 text-[11px]">
                Permanently delete this shop profile, inventory logs, and customer ledger data.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteError("");
                setDeleteConfirmationText("");
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Delete Account
            </button>
          </div>
        </div>
      </form>

      {/* Verification OTP Modal for Name/Phone Changes */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Verify Profile Change</h3>
              <p className="text-slate-500 text-xs mt-1">
                A verification code was sent to confirm changes to your owner identity.
              </p>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center">
              <span className="text-[11px] text-slate-500">Demo OTP: </span>
              <span className="font-bold text-slate-900">123456</span>
            </div>

            {otpError && (
              <p className="text-rose-600 font-semibold text-xs">{otpError}</p>
            )}

            <input
              type="text"
              maxLength={6}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full text-center text-lg font-bold font-mono tracking-widest px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtpAndSave}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GitHub-Style Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Delete Dukaan Account</h3>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              This action <strong>cannot</strong> be undone. This will permanently delete your store account, all inventory products, sales telemetry, and khata records.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
              <p className="text-rose-900 font-medium">
                To confirm deletion, type <strong>{currentUser?.storeName || "DELETE"}</strong> below:
              </p>
            </div>

            {deleteError && (
              <p className="text-rose-600 font-bold text-xs">{deleteError}</p>
            )}

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder={`Type ${currentUser?.storeName || "DELETE"}`}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 font-bold text-slate-900"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteLoading ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};