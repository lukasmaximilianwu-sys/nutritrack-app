import { Clock, Beef, Wheat, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Meal } from '@/lib/types';

interface NutrientTimingGraphProps {
  meals: Meal[];
}

const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function timeToPosition(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const hours = h + m / 60;
  return Math.max(0, Math.min(100, ((hours - START_HOUR) / TOTAL_HOURS) * 100));
}

export default function NutrientTimingGraph({ meals }: NutrientTimingGraphProps) {
  const sortedMeals = [...meals].sort((a, b) => a.time.localeCompare(b.time));

  const maxProtein = Math.max(0, ...sortedMeals.map((m) => m.protein));
  const maxCarbs = Math.max(0, ...sortedMeals.map((m) => m.carbs));
  const maxVal = Math.max(maxProtein, maxCarbs, 10);

  // Check spacing: ideal is a meal every 3-4 hours
  const gaps: number[] = [];
  for (let i = 1; i < sortedMeals.length; i++) {
    const prev = sortedMeals[i - 1].time;
    const curr = sortedMeals[i].time;
    const [ph, pm] = prev.split(':').map(Number);
    const [ch, cm] = curr.split(':').map(Number);
    gaps.push((ch + cm / 60) - (ph + pm / 60));
  }

  const tooClose = gaps.filter((g) => g < 2);
  const tooFar = gaps.filter((g) => g > 5);
  const wellSpaced = sortedMeals.length >= 3 && tooClose.length === 0 && tooFar.length === 0;

  const spacingStatus = sortedMeals.length === 0
    ? 'Noch keine Mahlzeiten heute.'
    : sortedMeals.length < 3
      ? `${sortedMeals.length} ${sortedMeals.length === 1 ? 'Mahlzeit' : 'Mahlzeiten'} — für optimale Muskelproteinsynthese alle 3-4h eine Protein-Dosis anstreben.`
      : wellSpaced
        ? 'Gut verteilt! Protein-Dosen sind optimal über den Tag gestreut.'
        : tooClose.length > 0
          ? `${tooClose.length} ${tooClose.length === 1 ? 'Mahlzeit' : 'Mahlzeiten'} zu nah beieinander — größere Pausen für gleichmäßige Versorgung.`
          : `${tooFar.length} ${tooFar.length === 1 ? 'Lücke' : 'Lücken'} > 5h — eine zusätzliche Protein-Dosis dazwischen empfohlen.`;

  const spacingGood = wellSpaced;
  const spacingWarning = tooClose.length > 0 || tooFar.length > 0;

  // Hour markers
  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h += 3) {
    hours.push(h);
  }

  return (
    <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-100">
        <Clock className="h-5 w-5 text-cyan-400" />
        Nutrient-Timing
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Protein- & Kohlenhydrat-Verteilung über den Tag (06:00–24:00 Uhr)
      </p>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Protein (g)
        </span>
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
          Carbs (g)
        </span>
      </div>

      {/* Graph */}
      <div className="relative">
        {/* Hour grid lines */}
        <div className="relative h-44">
          {/* Grid lines + labels */}
          {hours.map((h) => (
            <div
              key={h}
              className="absolute top-0 bottom-0 border-l border-slate-700/30"
              style={{ left: `${((h - START_HOUR) / TOTAL_HOURS) * 100}%` }}
            >
              <span className="absolute -top-0.5 -translate-x-1/2 text-[10px] text-slate-600">
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Meal bars */}
          {sortedMeals.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-slate-600">Noch keine Mahlzeiten heute geloggt.</p>
            </div>
          )}

          {sortedMeals.map((meal) => {
            const pos = timeToPosition(meal.time);
            const proteinHeight = (meal.protein / maxVal) * 100;
            const carbsHeight = (meal.carbs / maxVal) * 100;

            return (
              <div
                key={meal.id}
                className="absolute bottom-0 flex items-end gap-0.5"
                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
              >
                {/* Protein bar */}
                <div className="flex flex-col items-center">
                  <span className="mb-0.5 text-[9px] font-medium text-emerald-400">
                    {Math.round(meal.protein)}
                  </span>
                  <div
                    className="w-2.5 rounded-t-sm bg-emerald-500 transition-all"
                    style={{ height: `${proteinHeight * 1.2}px` }}
                  />
                </div>
                {/* Carbs bar */}
                <div className="flex flex-col items-center">
                  <span className="mb-0.5 text-[9px] font-medium text-amber-400">
                    {Math.round(meal.carbs)}
                  </span>
                  <div
                    className="w-2.5 rounded-t-sm bg-amber-500 transition-all"
                    style={{ height: `${carbsHeight * 1.2}px` }}
                  />
                </div>
                {/* Time label */}
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-slate-600">
                  {meal.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom time axis */}
        <div className="mt-6 h-px bg-slate-700/30" />
      </div>

      {/* Spacing status */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-900/40 p-3.5 ring-1 ring-slate-700/40">
        {spacingGood ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
        ) : spacingWarning ? (
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        ) : (
          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
        )}
        <div>
          <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            Verteilung
          </div>
          <p className="text-sm leading-relaxed text-slate-400">{spacingStatus}</p>
        </div>
      </div>
    </div>
  );
}
