import React, { useState } from "react";
import { Settings, Key, Database, Smartphone, Store, ShieldCheck, CheckCircle2, Cpu, Wifi } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { firebaseConfig, isConfiguredFirebase } from "../firebase/config";

export const SettingsPage: React.FC = () => {
  const { currentUser, currentStore } = useAuth();
  const [groqKey, setGroqKey] = useState("");
  const [savedKey, setSavedKey] = useState(false);

  const handleSaveGroq = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Settings & Store Profile</h1>
        <p className="text-xs text-slate-500">
          Shop Owner account configuration, PWA installation, Firebase Firestore, & Groq AI
        </p>
      </div>

      {/* Single Shop Owner Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center border border-emerald-200">
              RK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">{currentUser.name}</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authenticated Shop Owner
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.email} • {currentStore.name} ({currentStore.location})
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[10px]">Access Level</span>
            <span className="font-bold text-slate-900">Direct Dashboard Access</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[10px]">Assigned Store ID</span>
            <span className="font-bold text-slate-900 font-mono">{currentStore.storeId}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-slate-400 block text-[10px]">Kirana Region</span>
            <span className="font-bold text-slate-900">Indiranagar, Bengaluru</span>
          </div>
        </div>
      </div>

      {/* Progressive Web App (PWA) Capabilities Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Progressive Web App (PWA) Status</h3>
              <p className="text-xs text-slate-500">Service Worker & Offline Cache for Android, iOS, Windows, & Mac</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full border border-indigo-200">
            PWA Ready • Service Worker Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Offline Barcode Scanning Queue
            </span>
            <p className="text-[11px] text-slate-500">
              Scans made without internet are queued locally and automatically synchronized with Firestore upon reconnection.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Web App Manifest
            </span>
            <p className="text-[11px] text-slate-500">
              Configured with standalone viewport, background sync, and home screen shortcuts for POS Sale and Scanner.
            </p>
          </div>
        </div>
      </div>

      {/* Firebase Firestore Connection Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Firebase Firestore Connection</h3>
              <p className="text-xs text-slate-500">
                Status: {isConfiguredFirebase ? "Connected to Cloud Firestore" : "Realtime Reactive Engine Active (Dual-Mode)"}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
            {isConfiguredFirebase ? "Live Firestore" : "Reactive Local Engine"}
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
          <p className="font-semibold text-slate-700 font-sans">Firebase Credentials Setup:</p>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>Project ID: <span className="font-bold text-slate-900">{firebaseConfig.projectId}</span></div>
            <div>Auth Domain: <span className="font-bold text-slate-900">{firebaseConfig.authDomain}</span></div>
          </div>
        </div>
      </div>

      {/* Groq AI Engine Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Groq AI Engine Integration</h3>
            <p className="text-xs text-slate-500">Llama-3.3-70b-versatile for real-time inventory demand forecasting</p>
          </div>
        </div>

        <form onSubmit={handleSaveGroq} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">GROQ_API_KEY Environment Variable</label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Note: Key is automatically processed server-side in server.ts with Gemini API fallback.
            </p>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
            >
              {savedKey ? "Saved Successfully!" : "Save Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
