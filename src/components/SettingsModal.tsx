import { useState, useRef } from 'react';
import { X, Key, Save, Check, Target, Download, Upload, AlertCircle } from 'lucide-react';
import { getSettings, saveSettings } from '@/lib/storage';
import { DEFAULT_GOALS, NUTRIENT_METADATA, GROUP_LABELS } from '@/lib/nutrients';
import { exportAllData, validateBackup, importAllData } from '@/lib/gamification';
import type { NutrientMeta, NutrientKey } from '@/lib/nutrients';
import type { Goals, Settings } from '@/lib/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type MacroGoalKey = 'calories' | 'protein' | 'carbs' | 'fat';

export default function SettingsModal({ open, onClose, onSaved }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>(() => getSettings());
  const [saved, setSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    onSaved();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutritrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMsg({ type: 'success', text: 'Backup erfolgreich heruntergeladen.' });
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const result = validateBackup(raw);
      if (!result.valid || !result.data) {
        setBackupMsg({ type: 'error', text: result.error || 'Import fehlgeschlagen.' });
        setTimeout(() => setBackupMsg(null), 4000);
        return;
      }
      importAllData(result.data);
      setBackupMsg({ type: 'success', text: 'Daten erfolgreich wiederhergestellt!' });
      onSaved();
      setTimeout(() => {
        setBackupMsg(null);
        setSettings(getSettings());
      }, 1500);
    };
    reader.onerror = () => {
      setBackupMsg({ type: 'error', text: 'Datei konnte nicht gelesen werden.' });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const updateGoal = (key: MacroGoalKey | NutrientKey, value: number) => {
    setSettings((s) => ({ ...s, goals: { ...s.goals, [key]: value } }));
  };

  const resetGoals = () => {
    setSettings((s) => ({ ...s, goals: { ...DEFAULT_GOALS } }));
  };

  const groups: NutrientMeta['group'][] = ['vitamine', 'mineralstoffe', 'bioaktiv'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Key className="h-5 w-5 text-emerald-400" />
            Einstellungen
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* API Key section */}
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Groq API-Key</label>
          <p className="mb-3 text-xs text-slate-500 leading-relaxed">
            Du benötigst einen API-Key von <span className="font-medium text-slate-400">console.groq.com</span>, um Mahlzeiten per KI analysieren zu lassen. Der Key wird lokal in deinem Browser gespeichert.
          </p>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
            placeholder="gsk_..."
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Goals section */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Target className="h-4 w-4 text-cyan-400" />
              Tagesziele
            </h3>
            <button onClick={resetGoals} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Zurücksetzen
            </button>
          </div>

          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Makros</div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <GoalInput label="Kalorien (kcal)" value={settings.goals.calories} onChange={(v) => updateGoal('calories', v)} />
            <GoalInput label="Protein (g)" value={settings.goals.protein} onChange={(v) => updateGoal('protein', v)} />
            <GoalInput label="Carbs (g)" value={settings.goals.carbs} onChange={(v) => updateGoal('carbs', v)} />
            <GoalInput label="Fett (g)" value={settings.goals.fat} onChange={(v) => updateGoal('fat', v)} />
          </div>

          {groups.map((group) => {
            const items = NUTRIENT_METADATA.filter((m) => m.group === group);
            return (
              <div key={group} className="mb-4">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">{GROUP_LABELS[group]}</div>
                <div className="grid grid-cols-2 gap-3">
                  {items.map((meta) => (
                    <GoalInput
                      key={meta.key}
                      label={`${meta.label} (${meta.unit})`}
                      value={settings.goals[meta.key]}
                      onChange={(v) => updateGoal(meta.key, v)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Backup section */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-slate-300">Daten-Backup</h3>
          <p className="mb-3 text-xs text-slate-500 leading-relaxed">
            Sichere alle deine Daten (Mahlzeiten, Gewicht, Supplements, Nüsse, Shop-Freischaltungen) als JSON-Datei oder stelle ein bestehendes Backup wieder her.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-700/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          {backupMsg && (
            <div className={`mt-2.5 flex items-center gap-2 rounded-lg p-2.5 text-xs ${
              backupMsg.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-900/50'
                : 'bg-rose-950/40 text-rose-300 ring-1 ring-rose-900/50'
            }`}>
              {backupMsg.type === 'error' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span>{backupMsg.text}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-[0.98]"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Gespeichert!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Speichern
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function GoalInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        min={0}
        className="w-full rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
      />
    </div>
  );
}
