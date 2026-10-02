import React, { useState } from "react";
import { Database, CheckCircle2, AlertTriangle, X, Play, Loader2 } from "lucide-react";
import { injectStoreData } from "../utils/seedData";
import { useAuth } from "../contexts/AuthContext";

interface DevSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevSeedModal: React.FC<DevSeedModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [selectedTarget, setSelectedTarget] = useState<"ALL" | "RAO" | "KUMAR" | "SHARMA">("ALL");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isInjecting, setIsInjecting] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const handleInject = async () => {
    setIsInjecting(true);
    
    setCompleted(false);
    setErrorMessage("");
    setStatusMsg("Connecting to Cloud Firestore...");

    try {
      await injectStoreData(selectedTarget, (msg) => setStatusMsg(msg));
      setCompleted(true);
      setStatusMsg("Success! Data successfully written to Firestore.");
      setTimeout(() => {
        setIsInjecting(false);
      }, 1000);
    } catch (err: any) {
      console.error("Injection failed:", err);
      setErrorMessage(err?.message || "Permission denied or failed Firestore write.");
      setIsInjecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Firestore Mock Injector</h3>
              <p className="text-[11px] text-slate-500">Seed store test scenarios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Write Blocked / Error</span>
            </div>
            <p className="text-[11px] font-mono break-all">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="font-semibold text-slate-700">Select Store Scenario:</p>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="radio"
              name="targetStore"
              checked={selectedTarget === "ALL"}
              onChange={() => setSelectedTarget("ALL")}
              className="mt-1 accent-purple-600"
            />
            <div>
              <span className="font-bold text-slate-900 block">Populate All 3 Stores</span>
              <span className="text-slate-500 text-[11px]">
                High/Low for Rao, Normal for Kumar, 0-Stock for Sharma.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="radio"
              name="targetStore"
              checked={selectedTarget === "RAO"}
              onChange={() => setSelectedTarget("RAO")}
              className="mt-1 accent-purple-600"
            />
            <div>
              <span className="font-bold text-slate-900 block">Rao SUPER MARKET Only</span>
              <span className="text-slate-500 text-[11px]">High stock + 2 Low stock warnings.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="radio"
              name="targetStore"
              checked={selectedTarget === "KUMAR"}
              onChange={() => setSelectedTarget("KUMAR")}
              className="mt-1 accent-purple-600"
            />
            <div>
              <span className="font-bold text-slate-900 block">Kumar Store Only</span>
              <span className="text-slate-500 text-[11px]">Healthy baseline inventory.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <input
              type="radio"
              name="targetStore"
              checked={selectedTarget === "SHARMA"}
              onChange={() => setSelectedTarget("SHARMA")}
              className="mt-1 accent-purple-600"
            />
            <div>
              <span className="font-bold text-slate-900 block">Sharma Mart Only</span>
              <span className="text-slate-500 text-[11px]">Depleted zero-stock alerts.</span>
            </div>
          </label>
        </div>

        {currentUser && (
          <div className="p-2.5 bg-indigo-50 border border-indigo-200/60 rounded-xl text-[11px] text-indigo-900">
            Active Store: <strong>{currentUser.storeName}</strong>
          </div>
        )}

        {statusMsg && !errorMessage && (
          <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-700 flex items-center gap-2">
            {isInjecting && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />}
            {completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleInject}
            disabled={isInjecting}
            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isInjecting ? "Injecting Data..." : "Run Injection"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};