import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Flashlight, AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface RealBarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  scanMode?: "STOCK_IN" | "STOCK_OUT";
  className?: string;
}

const playScanBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    // AudioContext blocked or unsupported
  }
};

export const RealBarcodeScanner: React.FC<RealBarcodeScannerProps> = ({
  onScanSuccess,
  scanMode = "STOCK_IN",
  className = ""
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<{ code: string; time: number } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastCodeRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  // Helper: Forcefully stop hardware camera streams
  const stopHardwareCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    const elementId = "html5-qrcode-reader-element";
    const videoElem = document.querySelector(`#${elementId} video`) as HTMLVideoElement | null;
    if (videoElem && videoElem.srcObject) {
      const stream = videoElem.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoElem.srcObject = null;
    }

    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      } else {
        try {
          scannerRef.current.clear();
        } catch {}
      }
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const elementId = "html5-qrcode-reader-element";

    const startScanner = async () => {
      try {
        setCameraError(null);

        const domEl = document.getElementById(elementId);
        if (!domEl) return;

        const html5QrcodeScanner = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });

        scannerRef.current = html5QrcodeScanner;

        await html5QrcodeScanner.start(
          { facingMode: "environment" },
          { fps: 25, qrbox: { width: 280, height: 160 }, aspectRatio: 1.3333 },
          (decodedText) => {
            const now = Date.now();
            // COOLDOWN: 1.8 second delay prevents rapid multi-scans of the same item
            if (decodedText === lastCodeRef.current && now - lastTimeRef.current < 1800) {
              return;
            }

            lastCodeRef.current = decodedText;
            lastTimeRef.current = now;

            playScanBeep();
            if (navigator.vibrate) {
              navigator.vibrate([60, 30, 60]);
            }

            if (isMounted) {
              setLastScanned({ code: decodedText, time: now });
              onScanSuccess(decodedText);
            }
          },
          () => {}
        );

        if (isMounted) {
          setIsScanning(true);

          const videoElem = document.querySelector(`#${elementId} video`) as HTMLVideoElement | null;
          if (videoElem && videoElem.srcObject) {
            mediaStreamRef.current = videoElem.srcObject as MediaStream;
          }

          try {
            const capabilities = html5QrcodeScanner.getRunningTrackCapabilities();
            if (capabilities && (capabilities as any).torch) {
              setHasTorch(true);
            }
          } catch {
            setHasTorch(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("Camera start error:", err);
          setCameraError(
            err?.message || "Camera access failed. Please grant camera permission or use manual input."
          );
          setIsScanning(false);
        }
      }
    };

    startScanner();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHardwareCamera();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // CLEANUP: Shuts off hardware camera immediately when tab switches
    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopHardwareCamera();
    };
  }, []);

  const toggleTorch = async () => {
    if (scannerRef.current && hasTorch) {
      try {
        const nextState = !torchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextState }] as any
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn("Torch toggle error:", e);
      }
    }
  };

  return (
    <div className={`relative flex flex-col items-center w-full ${className}`}>
      <div className="relative w-full max-w-lg aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl">
        <div id="html5-qrcode-reader-element" className="w-full h-full object-cover" />

        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="relative w-64 h-36 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-emerald-500/5 transition-all">
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse my-16" />
            </div>

            <p className="text-[11px] font-bold text-slate-300 mt-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/80 shadow-md">
              Center barcode inside green box • Auto-Focus Active
            </p>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${
                scanMode === "STOCK_IN"
                  ? "bg-emerald-500 text-slate-950 border-emerald-400"
                  : "bg-amber-500 text-slate-950 border-amber-400"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {scanMode === "STOCK_IN" ? "MODE: STOCK IN (+1)" : "MODE: STOCK OUT / POS (-1)"}
            </span>
          </div>

          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                torchOn
                  ? "bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20"
                  : "bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800"
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}
        </div>

        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-30">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
            <h4 className="font-bold text-white text-base">Camera Initialization Warning</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">{cameraError}</p>
          </div>
        )}

        {lastScanned && Date.now() - lastScanned.time < 1200 && (
          <div className="absolute bottom-4 left-4 right-4 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between shadow-2xl z-30 animate-fade-in border border-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Scanned to Queue: {lastScanned.code}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};