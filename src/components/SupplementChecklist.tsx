import { useState, useMemo } from 'react';
import { Check, Plus, Pill, Clock, Trash2, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import type { Supplement, TimingSlot } from '@/lib/types';
import {
  getSupplements,
  toggleSupplementLog,
  getCheckedSupplementIds,
  deleteCustomSupplement,
} from '@/lib/supplements';
import { TIMING_LABELS } from '@/lib/supplements';
import SupplementCreatorModal from '@/components/SupplementCreatorModal';

interface SupplementChecklistProps {
  today: string;
  onCheckChange: () => void;
}

const SLOT_ORDER: TimingSlot[] = ['morgens', 'mittags', 'abends', 'vor_dem_schlafen'];

const SLOT_ICONS: Record<TimingSlot, React.ReactNode> = {
  morgens: <Sunrise className="h-3.5 w-3.5" />,
  mittags: <Sun className="h-3.5 w-3.5" />,
  abends: <Sunset className="h-3.5 w-3.5" />,
  vor_dem_schlafen: <Moon className="h-3.5 w-3.5" />,
};

export default function SupplementChecklist({ today, onCheckChange }: SupplementChecklistProps) {
  const [supplements, setSupplements] = useState<Supplement[]>(() => getSupplements());
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => getCheckedSupplementIds(today));
  const [creatorOpen, setCreatorOpen] = useState(false);

  const refreshState = () => {
    setSupplements(getSupplements());
    setCheckedIds(getCheckedSupplementIds(today));
    onCheckChange();
  };

  const handleToggle = (id: string) => {
    const newLogs = toggleSupplementLog(id, today);
    setCheckedIds(new Set(newLogs.filter((l) => l.date === today).map((l) => l.supplementId)));
    onCheckChange();
  };

  const handleDelete = (id: string) => {
    deleteCustomSupplement(id);
    refreshState();
  };

  const checkedCount = checkedIds.size;
  const totalCount = supplements.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const grouped = useMemo(() => {
    const groups: Record<TimingSlot, Supplement[]> = {
      morgens: [],
      mittags: [],
      abends: [],
      vor_dem_schlafen: [],
    };
    for (const supp of supplements) {
      groups[supp.timing].push(supp);
    }
    return groups;
  }, [supplements]);

  return (
    <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Pill className="h-5 w-5 text-emerald-400" />
          Tägliche Supplements &amp; Biohacks
        </h2>
        <button
          onClick={() => setCreatorOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          Eigenes
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>{checkedCount} / {totalCount} eingenommen</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Grouped by timing */}
      <div className="space-y-3">
        {SLOT_ORDER.map((slot) => {
          const items = grouped[slot];
          if (items.length === 0) return null;
          return (
            <div key={slot}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                {SLOT_ICONS[slot]}
                {TIMING_LABELS[slot]}
              </div>
              <div className="space-y-1.5">
                {items.map((supp) => {
                  const checked = checkedIds.has(supp.id);
                  return (
                    <div
                      key={supp.id}
                      className={`group flex items-center gap-3 rounded-lg p-2.5 transition-all ${
                        checked
                          ? 'bg-emerald-950/30 ring-1 ring-emerald-900/40'
                          : 'bg-slate-900/40 ring-1 ring-slate-800/50 hover:bg-slate-900/60'
                      }`}
                    >
                      <button
                        onClick={() => handleToggle(supp.id)}
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-all active:scale-90 ${
                          checked
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700/50 text-transparent hover:bg-slate-600'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${checked ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {supp.name}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{supp.dose}</span>
                          {supp.calories > 0 && <span>· {supp.calories} kcal</span>}
                          {supp.protein > 0 && <span>· {supp.protein}g P</span>}
                        </div>
                      </div>
                      {supp.isCustom && (
                        <button
                          onClick={() => handleDelete(supp.id)}
                          className="flex-shrink-0 text-slate-600 opacity-0 transition-all hover:text-rose-400 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <SupplementCreatorModal
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onCreated={refreshState}
      />
    </div>
  );
}
