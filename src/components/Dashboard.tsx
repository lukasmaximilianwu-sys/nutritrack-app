import type { DailyTotals, Goals, Meal } from '@/lib/types';
import type { NutrientKey, NutrientMeta } from '@/lib/nutrients';
import type { PhaseMode } from '@/lib/phases';
import type { BiohackingInsight } from '@/lib/biohacking';
import type { StreakData } from '@/lib/gamification';
import { NUTRIENT_METADATA, GROUP_LABELS, NUTRIENT_MAP } from '@/lib/nutrients';
import { getPhasePreset } from '@/lib/phases';
import { Flame, Beef, Wheat, Droplet, Info, Target, Sparkles } from 'lucide-react';
import { useState } from 'react';
import MicroGapAnalysis from '@/components/MicroGapAnalysis';
import NutrientTimingGraph from '@/components/NutrientTimingGraph';
import SupplementChecklist from '@/components/SupplementChecklist';
import BiohackingInsights from '@/components/BiohackingInsights';
import BioCoreReactor from '@/components/BioCoreReactor';

interface DashboardProps {
  totals: DailyTotals;
  goals: Goals;
  mealCount: number;
  meals: Meal[];
  phaseMode: PhaseMode;
  today: string;
  biohackingInsights: BiohackingInsight[];
  onSupplementChange: () => void;
  streak: StreakData;
}

export default function Dashboard({
  totals,
  goals,
  mealCount,
  meals,
  phaseMode,
  today,
  biohackingInsights,
  onSupplementChange,
  streak,
}: DashboardProps) {
  const groups: NutrientMeta['group'][] = ['vitamine', 'mineralstoffe', 'bioaktiv'];
  const preset = getPhasePreset(phaseMode);
  const focusSet = new Set(preset.focusNutrients);

  return (
    <div className="space-y-4">
      {/* Bio-Core Reactor Streak */}
      <BioCoreReactor streak={streak} />

      <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Tageswerte</h2>
          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            {mealCount > 0 && ` · ${mealCount} ${mealCount === 1 ? 'Mahlzeit' : 'Mahlzeiten'}`}
          </span>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MacroCard
            icon={<Flame className="h-5 w-5" />}
            label="Kalorien"
            value={Math.round(totals.calories)}
            unit="kcal"
            goal={goals.calories}
            colorClasses={{ ring: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/20' }}
          />
          <MacroCard
            icon={<Beef className="h-5 w-5" />}
            label="Protein"
            value={Math.round(totals.protein)}
            unit="g"
            goal={goals.protein}
            colorClasses={{ ring: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' }}
          />
          <MacroCard
            icon={<Wheat className="h-5 w-5" />}
            label="Carbs"
            value={Math.round(totals.carbs)}
            unit="g"
            goal={goals.carbs}
            colorClasses={{ ring: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/20' }}
          />
          <MacroCard
            icon={<Droplet className="h-5 w-5" />}
            label="Fett"
            value={Math.round(totals.fat)}
            unit="g"
            goal={goals.fat}
            colorClasses={{ ring: 'bg-sky-500', text: 'text-sky-400', glow: 'shadow-sky-500/20' }}
          />
        </div>

        {/* Phase focus badge */}
        <div className={`mb-4 flex items-start gap-2.5 rounded-xl p-3.5 ring-1 ${phaseMode === 'bulk' ? 'bg-emerald-950/30 ring-emerald-900/40' : phaseMode === 'cut' ? 'bg-orange-950/30 ring-orange-900/40' : 'bg-cyan-950/30 ring-cyan-900/40'}`}>
          <Target className={`mt-0.5 h-5 w-5 flex-shrink-0 ${preset.accentColor}`} />
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className={preset.accentColor}>{preset.label}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Fokus-Nährstoffe</span>
            </div>
            <p className="mb-2 text-xs text-slate-500">{preset.focusDescription}</p>
            <div className="flex flex-wrap gap-1.5">
              {preset.focusNutrients.map((key) => {
                const meta = NUTRIENT_MAP[key];
                return (
                  <span
                    key={key}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${preset.accentColor} bg-slate-900/50 ring-1 ring-slate-700/40`}
                  >
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mikronährstoffe & Bioaktive Stoffe */}
        <div className="border-t border-slate-700/50 pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mikronährstoffe &amp; Bioaktive Stoffe
          </h3>

          {groups.map((group) => {
            const items = NUTRIENT_METADATA.filter((m) => m.group === group);
            return (
              <div key={group} className="mb-4 last:mb-0">
                <div className="mb-2 text-[11px] font-medium text-slate-600">{GROUP_LABELS[group]}</div>
                <div className="grid grid-cols-1 gap-x-5 gap-y-2.5 sm:grid-cols-2">
                  {items.map((meta) => (
                    <NutrientBar
                      key={meta.key}
                      meta={meta}
                      value={(totals.micros as Record<NutrientKey, number>)[meta.key]}
                      goal={(goals as Record<NutrientKey, number>)[meta.key]}
                      isFocus={focusSet.has(meta.key)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <MicroGapAnalysis micros={totals.micros} goals={goals} />
        </div>
      </div>

      {/* Supplement Checklist */}
      <SupplementChecklist today={today} onCheckChange={onSupplementChange} />

      {/* Biohacking Insights */}
      <BiohackingInsights insights={biohackingInsights} />

      {/* Nutrient Timing Graph */}
      <NutrientTimingGraph meals={meals} />
    </div>
  );
}

interface MacroCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  goal: number;
  colorClasses: { ring: string; text: string; glow: string };
}

function MacroCard({ icon, label, value, unit, goal, colorClasses }: MacroCardProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const over = value > goal && goal > 0;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 transition-all hover:shadow-lg hover:shadow-slate-950/50">
      <div className="mb-2 flex items-center justify-between">
        <div className={`inline-flex rounded-lg p-2 ${colorClasses.ring}/20 ${colorClasses.text} bg-opacity-20`}>
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
        <span className={`text-xs font-medium ${over ? 'text-rose-400' : 'text-slate-500'}`}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-100">
        {value}
        <span className="ml-1 text-sm font-normal text-slate-500">/ {goal} {unit}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose-500' : colorClasses.ring}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

interface NutrientBarProps {
  meta: NutrientMeta;
  value: number;
  goal: number;
  isFocus: boolean;
}

function NutrientBar({ meta, value, goal, isFocus }: NutrientBarProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const over = value > goal && goal > 0;
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-slate-400">
          {meta.label}
          {isFocus && (
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400" title="Phasen-Fokus">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          )}
          <button
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onClick={() => setShowTip((v) => !v)}
            className="text-slate-600 transition-colors hover:text-slate-400"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </span>
        <span className="font-medium text-slate-300">
          {Math.round(value * 10) / 10}
          <span className="text-slate-600"> / {goal} {meta.unit}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose-500' : meta.color}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {showTip && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg bg-slate-900 p-2.5 text-xs leading-relaxed text-slate-300 shadow-xl ring-1 ring-slate-700/50">
          <div className="mb-1 font-semibold text-slate-100">{meta.label}</div>
          <div className="mb-1.5 text-slate-400">{meta.description}</div>
          <div className="text-slate-500">
            <span className="font-medium text-slate-400">Lebensmittel:</span> {meta.foods}
          </div>
          {isFocus && (
            <div className="mt-1.5 border-t border-slate-700/50 pt-1.5 font-medium text-emerald-400">
              Besonders wichtig in deiner aktuellen Phase
            </div>
          )}
        </div>
      )}
    </div>
  );
}
