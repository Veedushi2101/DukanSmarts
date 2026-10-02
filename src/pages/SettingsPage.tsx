import React, { useState } from "react";
import { 
  Store, 
  Receipt, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  KeyRound,
  Lock,
  Unlock,
  ShieldCheck,
  Send
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { sendChangeNotificationAlert } from "../services/authServices";

export const SettingsPage: React.FC = () => {
  const { currentUser, updateOwnerProfile, deleteAccount } = useAuth();

  // Shop Details
  const [storeName, setStoreName] = useState(currentUser?.storeName || "");
  const [billHeaderName, setBillHeaderName] = useState(currentUser?.billHeaderName || currentUser?.storeName || "");
  const [ownerName, setOwnerName] = useState(currentUser?.name || "");
  const [ownerPhone, setOwnerPhone] = useState(currentUser?.phone || "+91 89633121535");
  const [ownerEmail, setOwnerEmail] = useState(currentUser?.email || "owner@dukansmarts.in");
  const [storeAddress, setStoreAddress] = useState(currentUser?.address || "");

  // Preferences
  const [printReceipts, setPrintReceipts] = useState(true);
  const [scannerSound, setScannerSound] = useState(true);
  const [maxCreditLimit, setMaxCreditLimit] = useState(2000);
  const [lowStockLimit, setLowStockLimit] = useState(5);

  // Edit Gate & OTP Modal
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSentTo, setOtpSentTo] = useState<"PHONE" | "EMAIL">("PHONE");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Status & Notification feedback
  const [savedStatus, setSavedStatus] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Step 1: Owner initiates edit -> Send OTP
  const handleRequestUnlock = () => {
    setIsSendingOtp(true);
    setOtpError("");
    setEnteredOtp("");

    // Simulate sending OTP to phone or email
    setTimeout(() => {
      setIsSendingOtp(false);
      setShowOtpModal(true);
    }, 600);
  };

  // Step 2: Validate OTP -> Unlock inputs
  const handleVerifyOtp = () => {
    // Demo OTP key: 123456
    if (enteredOtp.trim() !== "123456") {
      setOtpError("Invalid verification code. Enter demo OTP: 123456");
      return;
    }
    setOtpError("");
    setShowOtpModal(false);
    setIsUnlocked(true);
  };

  // Step 3: Save changes & send notification alert
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) return;

    const changedFields: string[] = [];
    if (ownerName.trim() !== (currentUser?.name || "")) changedFields.push("Owner Name");
    if (ownerPhone.trim() !== (currentUser?.phone || "")) changedFields.push("Phone Number");
    if (storeName.trim() !== (currentUser?.storeName || "")) changedFields.push("Store Name");
    if (billHeaderName.trim() !== (currentUser?.billHeaderName || "")) changedFields.push("Invoice Header");
    if (storeAddress.trim() !== (currentUser?.address || "")) changedFields.push("Store Address");

    const payload = {
      name: ownerName.trim(),
      phone: ownerPhone.trim(),
      email: ownerEmail.trim(),
      storeName: storeName.trim(),
      billHeaderName: billHeaderName.trim(),
      address: storeAddress.trim()
    };

    try {
      await updateOwnerProfile(payload);
      setSavedStatus(true);
      setIsUnlocked(false); // Relock inputs after successful save

      // Send alert notification via SMS/Email
      const alert = await sendChangeNotificationAlert(
        { phone: ownerPhone, email: ownerEmail, name: ownerName },
        changedFields.length > 0 ? changedFields : ["General Preferences"]
      );

      setNotificationMsg(alert.message);
      setTimeout(() => {
        setSavedStatus(false);
        setNotificationMsg(null);
      }, 6000);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile settings.");
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
      setDeleteError(err?.message || "Failed to delete account.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto font-sans text-xs">
      <div id="recaptcha-container"></div>

      {/* Top Banner Alert Bar */}
      {notificationMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <Send className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Confirmation Alert Dispatched</p>
            <p className="text-slate-600 mt-0.5">{notificationMsg}</p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">Dukaan Settings</h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
              isUnlocked ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}>
              {isUnlocked ? <Unlock className="w-3 h-3 text-amber-600" /> : <Lock className="w-3 h-3 text-slate-500" />}
              {isUnlocked ? "Editing Unlocked" : "Secured Settings"}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Store identity and billing rules are locked behind two-factor OTP verification.
          </p>
        </div>

        {/* Action Toggle Button */}
        {!isUnlocked ? (
          <button
            type="button"
            onClick={handleRequestUnlock}
            disabled={isSendingOtp}
            className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>{isSendingOtp ? "Sending OTP..." : "Edit Settings"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSaveSettings}
            className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer shrink-0"
          >
            {savedStatus ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedStatus ? "Changes Saved!" : "Save & Dispatch Alert"}</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4 sm:space-y-5">
        {/* 1. Shop Info & Invoices */}
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
          isUnlocked ? "bg-white border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs" : "bg-white/70 border-slate-200/80 shadow-xs"
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-900">1. Shop & Printed Bill Details</h2>
            </div>
            {!isUnlocked && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-medium text-xs transition-colors ${
                  isUnlocked ? "bg-white border-slate-300 focus:border-emerald-500 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Owner Phone Number (Verified for SMS Alerts)
              </label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-medium text-xs transition-colors ${
                  isUnlocked ? "bg-white border-slate-300 focus:border-emerald-500 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Owner Email Address (Verified for Email Alerts)
              </label>
              <input
                type="email"
                disabled={!isUnlocked}
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-medium text-xs transition-colors ${
                  isUnlocked ? "bg-white border-slate-300 focus:border-emerald-500 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Dukaan / Store Name</label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-medium text-xs transition-colors ${
                  isUnlocked ? "bg-white border-slate-300 focus:border-emerald-500 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">Name Printed on Invoices</label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={billHeaderName}
                onChange={(e) => setBillHeaderName(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-medium text-xs transition-colors ${
                  isUnlocked ? "bg-white border-slate-300 focus:border-emerald-500 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-semibold mb-1">Shop Address</label>
              <input
                type="text"
                disabled={!isUnlocked}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-medium text-xs transition-colors ${
                  isUnlocked ? "bg-white border-slate-300 focus:border-emerald-500 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>
          </div>
        </div>

        {/* 2. Counter & Billing Preferences */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">2. Counter & Billing Preferences</h2>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-bold text-emerald-900 block leading-snug">Exact Rupee Billing Active</span>
                <span className="text-emerald-700 text-[11px] block mt-0.5">
                  Bills calculate exact rupee & paise amounts with zero auto-rounding.
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-200/80 text-emerald-900 font-bold rounded-lg text-[10px] shrink-0">
                Exact Total
              </span>
            </div>

            <label className={`flex items-center justify-between p-3.5 rounded-xl border min-h-[50px] gap-3 ${
              isUnlocked ? "bg-slate-50 cursor-pointer" : "bg-slate-100/60 opacity-70 cursor-not-allowed"
            }`}>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block leading-snug">Print Receipts Automatically</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Open receipt dialog immediately upon checkout
                </span>
              </div>
              <input
                type="checkbox"
                disabled={!isUnlocked}
                checked={printReceipts}
                onChange={(e) => setPrintReceipts(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded shrink-0"
              />
            </label>

            <label className={`flex items-center justify-between p-3.5 rounded-xl border min-h-[50px] gap-3 ${
              isUnlocked ? "bg-slate-50 cursor-pointer" : "bg-slate-100/60 opacity-70 cursor-not-allowed"
            }`}>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block leading-snug">Beep Sound on Barcode Scan</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">Audio feedback when camera detects barcode</span>
              </div>
              <input
                type="checkbox"
                disabled={!isUnlocked}
                checked={scannerSound}
                onChange={(e) => setScannerSound(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded shrink-0"
              />
            </label>
          </div>
        </div>

        {/* 3. Udhaar & Stock Limits */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">3. Customer Credit & Safety Limits</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Max Udhaar Per Customer (₹)</label>
              <input
                type="number"
                disabled={!isUnlocked}
                value={maxCreditLimit}
                onChange={(e) => setMaxCreditLimit(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-bold text-xs ${
                  isUnlocked ? "bg-white border-slate-300 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Low Stock Warning Alert Level</label>
              <input
                type="number"
                disabled={!isUnlocked}
                value={lowStockLimit}
                onChange={(e) => setLowStockLimit(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border font-bold text-xs ${
                  isUnlocked ? "bg-white border-slate-300 text-slate-900" : "bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              />
            </div>
          </div>
        </div>

        {/* 4. Danger Zone */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="font-bold text-sm">Danger Zone</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="min-w-0">
              <span className="font-bold text-slate-900 block">Delete This Shop & Account</span>
              <span className="text-slate-500 text-[11px] block mt-0.5">
                Permanently purge store credentials, catalog records, and khata logs.
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteError("");
                setDeleteConfirmationText("");
              }}
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </form>

      {/* Pre-Edit OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white max-w-sm w-full rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">Verify Identity to Edit</h3>
              <p className="text-slate-500 text-xs mt-1">
                A 6-digit verification code was sent to <strong className="text-slate-800">{otpSentTo === "PHONE" ? ownerPhone : ownerEmail}</strong>.
              </p>
            </div>

            {/* Delivery channel toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOtpSentTo("PHONE")}
                className={`py-1.5 rounded-lg transition-all ${
                  otpSentTo === "PHONE" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500"
                }`}
              >
                SMS: {ownerPhone.slice(-4)}
              </button>
              <button
                type="button"
                onClick={() => setOtpSentTo("EMAIL")}
                className={`py-1.5 rounded-lg transition-all ${
                  otpSentTo === "EMAIL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500"
                }`}
              >
                Email
              </button>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center">
              <span className="text-[11px] text-slate-500">Demo OTP Code: </span>
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
              className="w-full text-center text-lg font-bold font-mono tracking-widest px-3.5 py-2.5 min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="flex-1 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl cursor-pointer"
              >
                Unlock & Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Delete Dukaan Account</h3>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              This action <strong>cannot</strong> be undone. This permanently deletes your store account, products, and customer records.
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
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 font-bold text-slate-900 text-xs"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteLoading ? "Deleting..." : "Delete Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};