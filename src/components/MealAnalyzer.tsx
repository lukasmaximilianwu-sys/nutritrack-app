import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, Plus, Check, X, Mic, MicOff, Camera, ScanLine, Image as ImageIcon } from 'lucide-react';
import { analyzeMeal, analyzePhoto } from '@/lib/groq';
import { lookupBarcode } from '@/lib/openfoodfacts';
import { addMeal, generateId } from '@/lib/storage';
import { useSpeechRecognition } from '@/lib/useSpeechRecognition';
import { NUTRIENT_KEYS, NUTRIENT_MAP } from '@/lib/nutrients';
import type { NutrientKey } from '@/lib/nutrients';
import type { MealNutrition } from '@/lib/types';
import BarcodeScanner from '@/components/BarcodeScanner';

interface MealAnalyzerProps {
  onMealAdded: () => void;
  onOpenSettings: () => void;
}

interface AnalysisResult extends MealNutrition {
  foodText: string;
  photoDescription?: string;
  source?: 'text' | 'photo' | 'barcode';
}

type AnalysisMode = 'idle' | 'text' | 'photo' | 'barcode';

export default function MealAnalyzer({ onMealAdded, onOpenSettings }: MealAnalyzerProps) {
  const [foodText, setFoodText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<AnalysisMode>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep a ref to the base text so final speech results append correctly
  const baseTextRef = useRef('');
  const currentInterimRef = useRef('');

  const composeText = useCallback(() => {
    const base = baseTextRef.current;
    const interim = currentInterimRef.current;
    return [base, interim].filter(Boolean).join(' ');
  }, []);

  const { supported, listening, start, stop, error: speechError } = useSpeechRecognition({
    lang: 'de-DE',
    onResult: (text, isFinal) => {
      if (isFinal) {
        baseTextRef.current = [baseTextRef.current, text].filter(Boolean).join(' ');
        currentInterimRef.current = '';
      } else {
        currentInterimRef.current = text;
      }
      setFoodText(composeText());
    },
  });

  // Surface speech errors without clobbering analysis errors
  useEffect(() => {
    setVoiceError(speechError);
  }, [speechError]);

  const toggleListening = () => {
    if (listening) {
      stop();
    } else {
      baseTextRef.current = foodText;
      currentInterimRef.current = '';
      setVoiceError(null);
      start();
    }
  };

  // Keep baseTextRef in sync when user edits the textarea manually
  const handleTextChange = (value: string) => {
    setFoodText(value);
    if (!listening) {
      baseTextRef.current = value;
      currentInterimRef.current = '';
    }
  };

  const handleAnalyze = async () => {
    if (!foodText.trim()) return;
    setLoading(true);
    setLoadingMode('text');
    setError(null);
    setLastResult(null);

    try {
      const result = await analyzeMeal(foodText.trim());
      setLastResult({ ...result, foodText: foodText.trim(), source: 'text' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
      setLoadingMode('idle');
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle eine Bilddatei aus.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Das Bild ist zu groß (max. 4 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      analyzeSelectedPhoto(base64);
    };
    reader.onerror = () => {
      setError('Bild konnte nicht geladen werden.');
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const analyzeSelectedPhoto = async (base64: string) => {
    setLoading(true);
    setLoadingMode('photo');
    setError(null);
    setLastResult(null);

    try {
      const result = await analyzePhoto(base64);
      setLastResult({
        ...result,
        foodText: result.description,
        photoDescription: result.description,
        source: 'photo',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Foto-Analyse fehlgeschlagen.');
      setPhotoPreview(null);
    } finally {
      setLoading(false);
      setLoadingMode('idle');
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScannerOpen(false);
    setLoading(true);
    setLoadingMode('barcode');
    setError(null);
    setLastResult(null);

    try {
      const result = await lookupBarcode(barcode);
      const foodText = result.servingSize
        ? `${result.productName} (${result.servingSize})`
        : result.productName;
      setLastResult({
        ...result.nutrition,
        foodText,
        source: 'barcode',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Barcode-Lookup fehlgeschlagen.');
    } finally {
      setLoading(false);
      setLoadingMode('idle');
    }
  };

  const handleSave = () => {
    if (!lastResult) return;
    const now = new Date();
    addMeal({
      ...lastResult,
      id: generateId(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
    });
    setLastResult(null);
    setFoodText('');
    setPhotoPreview(null);
    baseTextRef.current = '';
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onMealAdded();
  };

  const handleDismissResult = () => {
    setLastResult(null);
    setPhotoPreview(null);
  };

  const sourceLabel = lastResult?.source === 'photo' ? 'Foto-Analyse'
    : lastResult?.source === 'barcode' ? 'Barcode-Scan'
    : 'Analyse';

  return (
    <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-100">
        <Sparkles className="h-5 w-5 text-emerald-400" />
        Mahlzeit analysieren
      </h2>

      {/* Photo preview */}
      {photoPreview && (
        <div className="relative mb-3 overflow-hidden rounded-xl ring-1 ring-slate-700/50">
          <img src={photoPreview} alt="Mahlzeit" className="max-h-48 w-full object-cover" />
          {!loading && (
            <button
              onClick={() => { setPhotoPreview(null); handleDismissResult(); }}
              className="absolute right-2 top-2 rounded-lg bg-slate-900/80 p-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {loading && loadingMode === 'photo' && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <textarea
          value={foodText}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze();
          }}
          placeholder="z.B. 200g Lachs, 150g Reis, 100g Kimchi"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3 pr-12 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
        />
        {supported && (
          <button
            onClick={toggleListening}
            title={listening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
            className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-95 ${
              listening
                ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40'
                : 'text-slate-500 hover:bg-slate-700/50 hover:text-slate-300'
            }`}
          >
            {listening ? (
              <span className="relative flex h-4 w-4 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                <Mic className="relative h-4 w-4" />
              </span>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Input mode buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title="Foto aufnehmen und analysieren"
          className="flex items-center gap-1.5 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Camera className="h-3.5 w-3.5" />
          Foto
        </button>

        {/* Barcode scanner */}
        <button
          onClick={() => setScannerOpen(true)}
          disabled={loading}
          title="Barcode scannen"
          className="flex items-center gap-1.5 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ScanLine className="h-3.5 w-3.5" />
          Barcode
        </button>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !foodText.trim()}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading && loadingMode === 'text' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analysiere...
            </>
          ) : loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              ...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analysieren
            </>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="ml-auto text-xs text-slate-400 transition-colors hover:text-slate-200"
        >
          API-Key?
        </button>
      </div>

      {/* Loading states for photo/barcode */}
      {loading && loadingMode === 'photo' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
          <ImageIcon className="h-3.5 w-3.5" />
          Foto wird per KI analysiert...
        </div>
      )}
      {loading && loadingMode === 'barcode' && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Produkt wird in Open Food Facts gesucht...
        </div>
      )}

      {!supported && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
          <MicOff className="h-3.5 w-3.5" />
          Spracheingabe wird in diesem Browser nicht unterstützt.
        </p>
      )}

      {voiceError && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {voiceError}
        </p>
      )}

      {listening && (
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
          Lausche... Sprich jetzt deine Mahlzeit ein.
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-950/40 p-3 text-sm text-rose-300 ring-1 ring-rose-900/50">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {lastResult && (
        <div className="mt-4 rounded-xl bg-emerald-950/30 p-4 ring-1 ring-emerald-900/40">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-sm text-emerald-200">
              <span className="font-medium">{sourceLabel}:</span>{' '}
              <span className="text-emerald-300/80">"{lastResult.foodText}"</span>
            </p>
            <button onClick={handleDismissResult} className="flex-shrink-0 text-emerald-700 hover:text-emerald-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MacroChip label="kcal" value={Math.round(lastResult.calories)} />
            <MacroChip label="Protein" value={`${Math.round(lastResult.protein)}g`} />
            <MacroChip label="Carbs" value={`${Math.round(lastResult.carbs)}g`} />
            <MacroChip label="Fett" value={`${Math.round(lastResult.fat)}g`} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {NUTRIENT_KEYS.slice(0, 12).map((key) => {
              const meta = NUTRIENT_MAP[key];
              const val = Math.round((lastResult.micros as Record<NutrientKey, number>)[key] * 10) / 10;
              if (val === 0) return null;
              return (
                <span key={key} className="rounded bg-slate-900/40 px-2 py-0.5 text-[10px] text-slate-300 ring-1 ring-slate-800/50">
                  {meta.shortLabel}: {val}{meta.unit}
                </span>
              );
            })}
            {NUTRIENT_KEYS.length > 12 && (
              <span className="rounded bg-slate-900/40 px-2 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-800/50">
                +{NUTRIENT_KEYS.length - 12} weitere
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98]"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" />
                Hinzugefügt!
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Zu Tageswerten hinzufügen
              </>
            )}
          </button>
        </div>
      )}

      {scannerOpen && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}

function MacroChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-900/50 p-2 text-center ring-1 ring-slate-800">
      <div className="text-base font-bold text-slate-100">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}
