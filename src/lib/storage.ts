import type { Meal, WeightEntry, Settings, Goals } from './types';
import type { PhaseMode } from './phases';
import { DEFAULT_GOALS } from './nutrients';
import { getPhaseGoals } from './phases';

const DEFAULT_PHASE: PhaseMode = 'recomp';

const MEALS_KEY = 'nutritrack_meals';
const WEIGHTS_KEY = 'nutritrack_weights';
const SETTINGS_KEY = 'nutritrack_settings';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getMeals(): Meal[] {
  return readJSON<Meal[]>(MEALS_KEY, []);
}

export function saveMeals(meals: Meal[]): void {
  writeJSON(MEALS_KEY, meals);
}

export function addMeal(meal: Meal): Meal[] {
  const meals = getMeals();
  meals.push(meal);
  saveMeals(meals);
  return meals;
}

export function deleteMeal(id: string): Meal[] {
  const meals = getMeals().filter((m) => m.id !== id);
  saveMeals(meals);
  return meals;
}

export function getWeights(): WeightEntry[] {
  return readJSON<WeightEntry[]>(WEIGHTS_KEY, []);
}

export function saveWeights(weights: WeightEntry[]): void {
  writeJSON(WEIGHTS_KEY, weights);
}

export function addWeight(entry: WeightEntry): WeightEntry[] {
  const weights = getWeights().filter((w) => w.date !== entry.date);
  weights.push(entry);
  weights.sort((a, b) => a.date.localeCompare(b.date));
  saveWeights(weights);
  return weights;
}

export function deleteWeight(id: string): WeightEntry[] {
  const weights = getWeights().filter((w) => w.id !== id);
  saveWeights(weights);
  return weights;
}

export function getSettings(): Settings {
  const s = readJSON<Partial<Settings>>(SETTINGS_KEY, {});
  const phaseMode = s.phaseMode || DEFAULT_PHASE;
  return {
    apiKey: s.apiKey || '',
    goals: { ...DEFAULT_GOALS, ...(s.goals || {}) },
    phaseMode,
  };
}

export function saveSettings(settings: Settings): void {
  writeJSON(SETTINGS_KEY, settings);
}

export function getApiKey(): string {
  return getSettings().apiKey;
}

export function saveApiKey(key: string): void {
  const s = getSettings();
  s.apiKey = key;
  saveSettings(s);
}

export function saveGoals(goals: Goals): void {
  const s = getSettings();
  s.goals = goals;
  saveSettings(s);
}

export function getPhaseMode(): PhaseMode {
  return getSettings().phaseMode;
}

export function savePhaseMode(mode: PhaseMode): void {
  const s = getSettings();
  s.phaseMode = mode;
  // Update macros to match phase preset, preserve any custom micro goals
  s.goals = { ...getPhaseGoals(mode), ...stripMacros(s.goals) };
  saveSettings(s);
}

function stripMacros(goals: Goals): Partial<Goals> {
  const { calories: _c, protein: _p, carbs: _cb, fat: _f, ...micros } = goals;
  return micros;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
