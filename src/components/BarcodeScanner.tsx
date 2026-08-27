import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine, AlertCircle, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const containerId = 'barcode-scanner-region';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const scannedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (scannedRef.current || !mounted) return;
            scannedRef.current = true;
            scanner.stop().then(() => {
              onScan(decodedText);
            }).catch(() => {
              onScan(decodedText);
            });
          },
          () => {}
        );

        if (mounted) setStarting(false);
      } catch (err) {
        if (mounted) {
          setStarting(false);
          setError(
            err instanceof Error
              ? `Kamera konnte nicht gestartet werden: ${err.message}`
              : 'Kamera konnte nicht gestartet werden.'
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner.stop().then(() => {
          scanner.clear();
        }).catch(() => {
          // ignore — scanner may already be stopped
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-slate-800 p-5 ring-1 ring-slate-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <ScanLine className="h-5 w-5 text-emerald-400" />
            Barcode scannen
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-700/50">
          <div id={containerId} className="w-full" />

          {starting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          )}

          {/* Scan frame overlay */}
          {!starting && !error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[150px] w-[250px] rounded-lg border-2 border-emerald-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-950/40 p-3 text-xs text-rose-300 ring-1 ring-rose-900/50">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!error && (
          <p className="mt-3 text-center text-xs text-slate-500">
            Halte den Barcode des Produkts in den Rahmen.
          </p>
        )}
      </div>
    </div>
  );
}
