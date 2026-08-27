import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { Micros, Goals } from '@/lib/types';
import type { NutrientKey } from '@/lib/nutrients';
import { NUTRIENT_METADATA, NUTRIENT_KEYS, NUTRIENT_FOODS, NUTRIENT_MAP } from '@/lib/nutrients';

interface MicroGapAnalysisProps {
  micros: Micros;
  goals: Goals;
}

interface GapItem {
  key: NutrientKey;
  label: string;
  unit: string;
  value: number;
  goal: number;
  pct: number;
  remaining: number;
  status: 'red' | 'yellow' | 'green';
  foods: string;
}

function classify(pct: number): 'red' | 'yellow' | 'green' {
  if (pct >= 100) return 'green';
  if (pct >= 60) return 'yellow';
  return 'red';
}

const STATUS_STYLES = {
  red: {
    badge: 'bg-rose-500/15 ring-1 ring-rose-500/30',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    text: 'text-rose-300',
  },
  yellow: {
    badge: 'bg-amber-500/15 ring-1 ring-amber-500/30',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    text: 'text-amber-300',
  },
  green: {
    badge: 'bg-emerald-500/15 ring-1 ring-emerald-500/30',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    text: 'text-emerald-300',
  },
};

export default function MicroGapAnalysis({ micros, goals }: MicroGapAnalysisProps) {
  const items: GapItem[] = NUTRIENT_KEYS.map((key) => {
    const meta = NUTRIENT_MAP[key];
    const value = (micros as Record<NutrientKey, number>)[key] || 0;
    const goal = (goals as Record<NutrientKey, number>)[key] || meta.goal;
    const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    const remaining = Math.max(0, Math.round((goal - value) * 10) / 10);
    return {
      key,
      label: meta.label,
      unit: meta.unit,
      value,
      goal,
      pct,
      remaining,
      status: classify(pct),
      foods: NUTRIENT_FOODS[key],
    };
  });

  const gaps = items.filter((i) => i.status !== 'green');
  const worstGaps = gaps.filter((i) => i.status === 'red');

  // Show top 3 red gaps in the tip
  const topGaps = worstGaps.slice(0, 3);

  const tipText = topGaps.length > 0
    ? `Noch ${worstGaps.length} ${worstGaps.length === 1 ? 'Lücke' : 'Lücken'}: ${topGaps.map((g) => `${g.label} (${g.remaining}${g.unit})`).join(', ')}. Empfehlung: ${topGaps.map((g) => g.foods).join(' bzw. ')} einbauen.`
    : gaps.length > 0
      ? `Fast am Ziel: ${gaps.slice(0, 4).map((g) => `${g.label} (noch ${g.remaining}${g.unit})`).join(', ')} — gezielt ergänzen.`
      : 'Alle Mikronährstoff-Ziele heute erreicht! Ausgezeichnet.';

  return (
    <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-100">
        <AlertTriangle className="h-5 w-5 text-amber-400" />
        Mikro-Lücken-Analyse
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Alle {NUTRIENT_KEYS.length} Stoffe im Vergleich zu deinen Tageszielen — farbig nach Dringlichkeit.
      </p>

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const style = STATUS_STYLES[item.status];
          return (
            <div
              key={item.key}
              className={`rounded-lg p-2.5 ${style.badge} transition-all`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate text-[11px] font-medium text-slate-200">{item.label}</span>
                <span className={`flex items-center gap-1 text-[9px] font-semibold ${style.text}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {Math.round(item.pct)}%
                </span>
              </div>
              <div className="mb-1.5 text-xs font-bold text-slate-100">
                {Math.round(item.value * 10) / 10}
                <span className="ml-0.5 text-[10px] font-normal text-slate-500">/ {item.goal} {item.unit}</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-900/40">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto tip */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-900/40 p-3.5 ring-1 ring-slate-700/40">
        {worstGaps.length === 0 && gaps.length === 0 ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
        ) : (
          <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        )}
        <div>
          <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            {worstGaps.length === 0 && gaps.length === 0 ? 'Alles gedeckt' : 'Empfehlung'}
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{tipText}</p>
        </div>
      </div>
    </div>
  );
}
