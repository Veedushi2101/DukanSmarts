import React, { useState } from "react";
import { Store, User, Phone, MapPin, Receipt, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const StoreSetupPage: React.FC = () => {
  const { completeOnboarding, firebaseUser } = useAuth();

  const [ownerName, setOwnerName] = useState(firebaseUser?.displayName || "");
  const [storeName, setStoreName] = useState("");
  const [billHeaderName, setBillHeaderName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !storeName.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill in all required shop details.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await completeOnboarding({
        ownerName,
        storeName,
        billHeaderName: billHeaderName.trim() || storeName,
        phone,
        address
      });
      // Redirect to main dashboard view
      window.history.pushState(null, "", "/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to save details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">One-Time Store Setup</h1>
          <p className="text-slate-500">
            Set up your shop profile. These details will be printed on customer bills.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Owner Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Store / Dukaan Name *</label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    if (!billHeaderName) setBillHeaderName(e.target.value);
                  }}
                  placeholder="e.g. Patel Super Mart"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Name Printed on Bill</label>
              <div className="relative">
                <Receipt className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={billHeaderName}
                  onChange={(e) => setBillHeaderName(e.target.value)}
                  placeholder="e.g. Patel Mart POS"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Contact Phone Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Shop Address (For Bills) *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop No. 12, Market Complex, Indiranagar"
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 resize-none font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>{loading ? "Registering Dukaan..." : "Save Store & Go to Dashboard"}</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </button>
        </form>
      </div>
    </div>
  );
};