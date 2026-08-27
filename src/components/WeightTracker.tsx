import { useState, useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus, Plus, Scale, Trash2 } from 'lucide-react';
import type { WeightEntry } from '@/lib/types';
import { addWeight, deleteWeight, generateId } from '@/lib/storage';

interface WeightTrackerProps {
  weights: WeightEntry[];
  onWeightsChanged: () => void;
}

function calcMovingAverage(weights: WeightEntry[], days: number): { date: string; avg: number }[] {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const result: { date: string; avg: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const window = sorted.slice(Math.max(0, i - days + 1), i + 1);
    const avg = window.reduce((sum, w) => sum + w.weight, 0) / window.length;
    result.push({ date: sorted[i].date, avg: Math.round(avg * 10) / 10 });
  }

  return result;
}

export default function WeightTracker({ weights, onWeightsChanged }: WeightTrackerProps) {
  const [weightInput, setWeightInput] = useState('');

  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => b.date.localeCompare(a.date)),
    [weights]
  );

  const movingAvg = useMemo(() => calcMovingAverage(weights, 7), [weights]);

  const latestAvg = movingAvg.length > 0 ? movingAvg[movingAvg.length - 1].avg : null;
  const prevAvg = movingAvg.length > 1 ? movingAvg[movingAvg.length - 2].avg : null;

  const trend = latestAvg !== null && prevAvg !== null
    ? latestAvg < prevAvg
      ? 'down'
      : latestAvg > prevAvg
        ? 'up'
        : 'flat'
    : 'flat';

  const trendDiff = latestAvg !== null && prevAvg !== null
    ? Math.abs(Math.round((latestAvg - prevAvg) * 10) / 10)
    : 0;

  const handleAdd = () => {
    const val = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(val) || val <= 0 || val > 500) return;
    const today = new Date().toISOString().split('T')[0];
    addWeight({ id: generateId(), date: today, weight: val });
    setWeightInput('');
    onWeightsChanged();
  };

  const handleDelete = (id: string) => {
    deleteWeight(id);
    onWeightsChanged();
  };

  const chartData = useMemo(() => {
    const recent = [...weights].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    if (recent.length < 2) return null;

    const wValues = recent.map((w) => w.weight);
    const aValues = calcMovingAverage(weights, 7)
      .filter((p) => p.date >= recent[0].date)
      .map((p) => p.avg);

    const all = [...wValues, ...aValues];
    const min = Math.min(...all) - 1;
    const max = Math.max(...all) + 1;
    const range = max - min || 1;

    const wPoints = wValues.map((v, i) => ({
      x: (i / (recent.length - 1)) * 100,
      y: 100 - ((v - min) / range) * 100,
    }));

    const aPoints = aValues.map((v, i) => ({
      x: (i / (aValues.length - 1)) * 100,
      y: 100 - ((v - min) / range) * 100,
    }));

    return { wPoints, aPoints, recent };
  }, [weights]);

  const svgPath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-100">
        <Scale className="h-5 w-5 text-cyan-400" />
        Gewicht
      </h2>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">7-Tage-Durchschnitt</div>
          {latestAvg !== null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-100">{latestAvg.toFixed(1)}</span>
              <span className="text-sm text-slate-500">kg</span>
              {trend !== 'flat' && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'down' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trend === 'down' ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                  {trendDiff} kg
                </span>
              )}
              {trend === 'flat' && (
                <span className="flex items-center gap-0.5 text-xs font-medium text-slate-500">
                  <Minus className="h-3.5 w-3.5" />
                  stabil
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-600">Noch keine Daten</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="kg"
            className="w-20 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
          />
          <button
            onClick={handleAdd}
            disabled={!weightInput.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-500 active:scale-[0.98] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Eintragen
          </button>
        </div>
      </div>

      {chartData && (
        <div className="mb-4 rounded-xl bg-slate-900/40 p-3 ring-1 ring-slate-800">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-32 w-full">
            <path
              d={svgPath(chartData.wPoints)}
              fill="none"
              stroke="rgb(8 145 178)"
              strokeWidth="0.8"
              vectorEffect="non-scaling-stroke"
              opacity="0.5"
            />
            <path
              d={svgPath(chartData.aPoints)}
              fill="none"
              stroke="rgb(34 211 238)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-cyan-700" /> Tägliche Werte
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-cyan-400" /> 7-Tage-Schnitt
            </span>
          </div>
        </div>
      )}

      {sortedWeights.length > 0 && (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {sortedWeights.slice(0, 10).map((w) => (
            <div
              key={w.id}
              className="group flex items-center justify-between rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-slate-900/40"
            >
              <span className="text-slate-400">
                {new Date(w.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-200">{w.weight} kg</span>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-slate-700 opacity-0 transition-all hover:text-rose-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
