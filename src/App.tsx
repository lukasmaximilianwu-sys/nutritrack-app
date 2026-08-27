import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Settings as SettingsIcon, Apple, Heart, TrendingUp, Flame, Dumbbell, ChevronDown, ShoppingBag } from 'lucide-react';
import type { Meal, WeightEntry, Goals, DailyTotals } from '@/lib/types';
import type { PhaseMode } from '@/lib/phases';
import { PHASE_PRESETS, PHASE_MAP, getPhaseGoals } from '@/lib/phases';
import { EMPTY_MICROS } from '@/lib/types';
import { NUTRIENT_KEYS, NUTRIENT_MAP } from '@/lib/nutrients';
import { getMeals, getWeights, getSettings, getApiKey, savePhaseMode } from '@/lib/storage';
import { getCheckedSupplements } from '@/lib/supplements';
import { analyzeBiohacking } from '@/lib/biohacking';
import {
  getNuts, checkAndAwardNuts, getStreak, updateStreak,
} from '@/lib/gamification';
import type { StreakData } from '@/lib/gamification';
import type { GoalCompletion } from '@/components/GoalCompletionBanner';
import Dashboard from '@/components/Dashboard';
import MealAnalyzer from '@/components/MealAnalyzer';
import MealHistory from '@/components/MealHistory';
import WeightTracker from '@/components/WeightTracker';
import SettingsModal from '@/components/SettingsModal';
import NutShop from '@/components/NutShop';
import GoalCompletionBanner from '@/components/GoalCompletionBanner';

function sumMeals(meals: Meal[]): DailyTotals {
  return meals.reduce<DailyTotals>((acc, m) => {
    acc.calories += m.calories;
    acc.protein += m.protein;
    acc.carbs += m.carbs;
    acc.fat += m.fat;
    for (const key of NUTRIENT_KEYS) {
      (acc.micros as unknown as Record<string, number>)[key] += m.micros[key];
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, micros: { ...EMPTY_MICROS } });
}

function sumSupplements(supplements: ReturnType<typeof getCheckedSupplements>): DailyTotals {
  return supplements.reduce<DailyTotals>((acc, s) => {
    acc.calories += s.calories;
    acc.protein += s.protein;
    acc.carbs += s.carbs;
    acc.fat += s.fat;
    for (const key of NUTRIENT_KEYS) {
      (acc.micros as unknown as Record<string, number>)[key] += s.micros[key];
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, micros: { ...EMPTY_MICROS } });
}

function mergeTotals(a: DailyTotals, b: DailyTotals): DailyTotals {
  const result: DailyTotals = {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    micros: { ...EMPTY_MICROS },
  };
  for (const key of NUTRIENT_KEYS) {
    (result.micros as unknown as Record<string, number>)[key] =
      (a.micros as unknown as Record<string, number>)[key] +
      (b.micros as unknown as Record<string, number>)[key];
  }
  return result;
}

const PHASE_ICONS: Record<PhaseMode, React.ReactNode> = {
  bulk: <TrendingUp className="h-4 w-4" />,
  cut: <Flame className="h-4 w-4" />,
  recomp: <Dumbbell className="h-4 w-4" />,
};

export default function App() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [goals, setGoals] = useState<Goals>(() => getSettings().goals);
  const [phaseMode, setPhaseMode] = useState<PhaseMode>(() => getSettings().phaseMode || 'recomp');
  const [phaseMenuOpen, setPhaseMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [supplementVersion, setSupplementVersion] = useState(0);
  const [nuts, setNuts] = useState(() => getNuts());
  const [streak, setStreak] = useState<StreakData>(() => getStreak());
  const [goalCompletions, setGoalCompletions] = useState<GoalCompletion[]>([]);
  const completionIdRef = useRef(0);
  const today = new Date().toISOString().split('T')[0];

  const refresh = useCallback(() => {
    const todayDate = new Date().toISOString().split('T')[0];
    setMeals(getMeals().filter((m) => m.date === todayDate).sort((a, b) => b.time.localeCompare(a.time)));
    setWeights(getWeights());
    const s = getSettings();
    setGoals(s.goals);
    setPhaseMode(s.phaseMode || 'recomp');
    setHasApiKey(!!getApiKey());
    setNuts(getNuts());
    setStreak(getStreak());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const mealTotals = useMemo(() => sumMeals(meals), [meals]);
  const checkedSupplements = useMemo(
    () => getCheckedSupplements(today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, supplementVersion]
  );
  const supplementTotals = useMemo(() => sumSupplements(checkedSupplements), [checkedSupplements]);
  const totals = useMemo(() => mergeTotals(mealTotals, supplementTotals), [mealTotals, supplementTotals]);

  const biohackingInsights = useMemo(
    () => analyzeBiohacking({ meals, checkedSupplements }),
    [meals, checkedSupplements]
  );

  // Award nuts and check streak when totals change
  useEffect(() => {
    const { newlyAwarded } = checkAndAwardNuts(totals, goals, today);
    if (newlyAwarded.length > 0) {
      setNuts(getNuts());
      const completions: GoalCompletion[] = newlyAwarded.map((a) => {
        completionIdRef.current += 1;
        let value = '';
        if (a.key === 'calories') value = `${Math.round(totals.calories)} kcal`;
        else if (a.key === 'protein') value = `${Math.round(totals.protein)}g`;
        else if (a.key === 'carbs') value = `${Math.round(totals.carbs)}g`;
        else if (a.key === 'fat') value = `${Math.round(totals.fat)}g`;
        else {
          const meta = NUTRIENT_MAP[a.key as keyof typeof NUTRIENT_MAP];
          value = `${Math.round((totals.micros as unknown as Record<string, number>)[a.key])} ${meta?.unit || ''}`;
        }
        return { id: completionIdRef.current, label: a.label, value, nuts: a.amount };
      });
      setGoalCompletions((prev) => [...prev, ...completions]);
    }

    // Update streak
    const updatedStreak = updateStreak(totals, goals, today);
    setStreak(updatedStreak);
  }, [totals, goals, today]);

  const handlePhaseChange = (mode: PhaseMode) => {
    setPhaseMode(mode);
    savePhaseMode(mode);
    setGoals(getPhaseGoals(mode));
    setPhaseMenuOpen(false);
  };

  const handleSupplementChange = useCallback(() => {
    setSupplementVersion((v) => v + 1);
    refresh();
  }, [refresh]);

  const dismissCompletion = useCallback((id: number) => {
    setGoalCompletions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const currentPreset = PHASE_MAP[phaseMode];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Ambient gradient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      {/* Goal completion banner */}
      <GoalCompletionBanner completions={goalCompletions} onDismiss={dismissCompletion} />

      <div className="relative">
        <header className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <Apple className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-100 leading-none">NutriTrack</h1>
                  <p className="mt-0.5 text-[11px] text-slate-500">KI-Ernährungstagebuch</p>
                </div>
              </div>

              {/* Phase selector */}
              <div className="relative">
                <button
                  onClick={() => setPhaseMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-1.5 text-sm font-medium transition-all hover:bg-slate-700 ${currentPreset.accentColor}`}
                >
                  {PHASE_ICONS[phaseMode]}
                  <span className="hidden sm:inline">{currentPreset.label}</span>
                  <span className="sm:hidden">{currentPreset.shortLabel}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${phaseMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {phaseMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setPhaseMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl bg-slate-800 p-2 shadow-2xl ring-1 ring-slate-700/50">
                      {PHASE_PRESETS.map((preset) => (
                        <button
                          key={preset.mode}
                          onClick={() => handlePhaseChange(preset.mode)}
                          className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-slate-700/50 ${
                            phaseMode === preset.mode ? 'bg-slate-700/40' : ''
                          }`}
                        >
                          <div className={`mt-0.5 flex-shrink-0 ${preset.accentColor}`}>
                            {PHASE_ICONS[preset.mode]}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${preset.accentColor}`}>
                              {preset.label}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              {preset.description}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-600">
                              {preset.macros.calories} kcal · {preset.macros.protein}g P · {preset.macros.carbs}g C · {preset.macros.fat}g F
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nut balance */}
              <button
                onClick={() => setShopOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 text-sm font-bold text-amber-400 transition-all hover:bg-slate-700 active:scale-95"
                title="Nuss-Shop öffnen"
              >
                🥜 {nuts}
              </button>

              <button
                onClick={() => setShopOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                title="Nuss-Shop"
              >
                <ShoppingBag className="h-4 w-4" />
              </button>

              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Einstellungen</span>
                {!hasApiKey && (
                  <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-rose-400" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <Dashboard
                totals={totals}
                goals={goals}
                mealCount={meals.length}
                meals={meals}
                phaseMode={phaseMode}
                today={today}
                biohackingInsights={biohackingInsights}
                onSupplementChange={handleSupplementChange}
                streak={streak}
              />
              <WeightTracker weights={weights} onWeightsChanged={refresh} />
              <MealHistory meals={meals} onMealDeleted={refresh} />
            </div>
            <div className="lg:col-span-2">
              <MealAnalyzer
                onMealAdded={refresh}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </div>
          </div>
        </main>

        <footer className="mx-auto max-w-5xl px-4 py-6">
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-600">
            <Heart className="h-3.5 w-3.5 text-emerald-600" />
            Powered by Groq llama-3.3-70b-versatile · PWA-ready
          </p>
        </footer>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={refresh}
      />

      <NutShop
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        onPurchase={() => setNuts(getNuts())}
      />
    </div>
  );
}
