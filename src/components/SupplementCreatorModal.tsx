import { useState } from 'react';
import { X, Plus, Check, Pill } from 'lucide-react';
import type { TimingSlot, Micros } from '@/lib/types';
import { EMPTY_MICROS } from '@/lib/types';
import { TIMING_SLOTS, createSupplement, addCustomSupplement } from '@/lib/supplements';
import type { Supplement } from '@/lib/types';

interface SupplementCreatorModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function SupplementCreatorModal({ open, onClose, onCreated }: SupplementCreatorModalProps) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [timing, setTiming] = useState<TimingSlot>('morgens');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showMicros, setShowMicros] = useState(false);
  const [micros, setMicros] = useState<Micros>({ ...EMPTY_MICROS });
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const supplement: Supplement = createSupplement({
      name: name.trim(),
      dose: dose.trim() || '—',
      timing,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      micros,
    });

    addCustomSupplement(supplement);
    setSaved(true);
    onCreated();
    setTimeout(() => {
      setSaved(false);
      resetForm();
      onClose();
    }, 1200);
  };

  const resetForm = () => {
    setName('');
    setDose('');
    setTiming('morgens');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setShowMicros(false);
    setMicros({ ...EMPTY_MICROS });
  };

  const updateMicro = (key: keyof Micros, value: string) => {
    setMicros((m) => ({ ...m, [key]: Number(value) || 0 }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Pill className="h-5 w-5 text-emerald-400" />
            Supplement erstellen
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Name + Dose */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Ashwagandha"
              className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Dosis</label>
            <input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="z.B. 600mg"
              className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Timing */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-slate-500">Einnahmezeit</label>
          <div className="grid grid-cols-2 gap-2">
            {TIMING_SLOTS.map((slot) => (
              <button
                key={slot.value}
                onClick={() => setTiming(slot.value)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                  timing === slot.value
                    ? 'bg-emerald-600/20 text-emerald-300 ring-2 ring-emerald-500/40'
                    : 'bg-slate-900/40 text-slate-400 ring-1 ring-slate-700/40 hover:bg-slate-700/40'
                }`}
              >
                <span className="text-base">{slot.emoji}</span>
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional macros */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-slate-500">Makros (optional)</label>
          <div className="grid grid-cols-4 gap-2">
            <NumInput label="kcal" value={calories} onChange={setCalories} />
            <NumInput label="Protein" value={protein} onChange={setProtein} />
            <NumInput label="Carbs" value={carbs} onChange={setCarbs} />
            <NumInput label="Fett" value={fat} onChange={setFat} />
          </div>
        </div>

        {/* Optional micros */}
        <div className="mb-4">
          <button
            onClick={() => setShowMicros((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showMicros ? '− Mikronährstoffe ausblenden' : '+ Mikronährstoffe hinzufügen (optional)'}
          </button>
          {showMicros && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(EMPTY_MICROS) as (keyof Micros)[]).map((key) => (
                <div key={key}>
                  <label className="mb-0.5 block text-[10px] text-slate-600">
                    {key.replace(/_/g, ' ').replace(/ mcg| mg| g/, (m) => m)}
                  </label>
                  <input
                    type="number"
                    value={micros[key] || ''}
                    onChange={(e) => updateMicro(key, e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full rounded border border-slate-700/50 bg-slate-900/50 px-2 py-1 text-xs text-slate-100 outline-none focus:border-emerald-500/50"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim() || saved}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Erstellt!
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Supplement hinzufügen
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-slate-600">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        min={0}
        className="w-full rounded border border-slate-700/50 bg-slate-900/50 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-500/50"
      />
    </div>
  );
}
