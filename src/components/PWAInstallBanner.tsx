import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, CheckCircle } from "lucide-react";

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between text-xs transition-all shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
          <Smartphone className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-slate-100">Install StockPilot PWA App</span>
          <span className="hidden sm:inline text-slate-400 ml-2">
            • Instant offline barcode scanning & home screen access
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Add to Home Screen</span>
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
