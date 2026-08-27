import type { Supplement, SupplementLog } from './types';
import type { TimingSlot } from './types';
import { EMPTY_MICROS } from './types';
import { generateId } from './storage';

const SUPPLEMENTS_KEY = 'nutritrack_supplements';
const SUPPLEMENT_LOGS_KEY = 'nutritrack_supplement_logs';

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

export const TIMING_SLOTS: { value: TimingSlot; label: string; emoji: string }[] = [
  { value: 'morgens', label: 'Morgens', emoji: '☀' },
  { value: 'mittags', label: 'Mittags', emoji: '◐' },
  { value: 'abends', label: 'Abends', emoji: '◑' },
  { value: 'vor_dem_schlafen', label: 'Vor dem Schlafen', emoji: '☾' },
];

export const TIMING_LABELS: Record<TimingSlot, string> = {
  morgens: 'Morgens',
  mittags: 'Mittags',
  abends: 'Abends',
  vor_dem_schlafen: 'Vor dem Schlafen',
};

export const DEFAULT_SUPPLEMENTS: Supplement[] = [
  {
    id: 'default_creatine',
    name: 'Kreatin',
    dose: '5g',
    timing: 'morgens',
    isDefault: true,
    isCustom: false,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    micros: { ...EMPTY_MICROS },
  },
  {
    id: 'default_omega3',
    name: 'Omega-3',
    dose: '2000mg',
    timing: 'mittags',
    isDefault: true,
    isCustom: false,
    calories: 20,
    protein: 0,
    carbs: 0,
    fat: 2,
    micros: { ...EMPTY_MICROS, omega3_g: 2 },
  },
  {
    id: 'default_vitd3_k2',
    name: 'Vitamin D3 / K2',
    dose: '50µg / 200µg',
    timing: 'morgens',
    isDefault: true,
    isCustom: false,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    micros: { ...EMPTY_MICROS, vitamin_d_mcg: 50, vitamin_k_mcg: 200 },
  },
  {
    id: 'default_magnesium',
    name: 'Magnesium',
    dose: '400mg',
    timing: 'vor_dem_schlafen',
    isDefault: true,
    isCustom: false,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    micros: { ...EMPTY_MICROS, magnesium_mg: 400 },
  },
  {
    id: 'default_zink',
    name: 'Zink',
    dose: '15mg',
    timing: 'abends',
    isDefault: true,
    isCustom: false,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    micros: { ...EMPTY_MICROS, zink_mg: 15 },
  },
  {
    id: 'default_whey',
    name: 'Whey Protein',
    dose: '30g Protein',
    timing: 'morgens',
    isDefault: true,
    isCustom: false,
    calories: 120,
    protein: 30,
    carbs: 2,
    fat: 1,
    micros: { ...EMPTY_MICROS },
  },
];

export function getSupplements(): Supplement[] {
  const stored = readJSON<Supplement[]>(SUPPLEMENTS_KEY, []);
  // Merge defaults with any custom supplements
  const custom = stored.filter((s) => s.isCustom);
  return [...DEFAULT_SUPPLEMENTS, ...custom];
}

export function saveCustomSupplements(supplements: Supplement[]): void {
  const custom = supplements.filter((s) => s.isCustom);
  writeJSON(SUPPLEMENTS_KEY, custom);
}

export function addCustomSupplement(supplement: Supplement): Supplement[] {
  const all = getSupplements();
  all.push(supplement);
  saveCustomSupplements(all);
  return all;
}

export function deleteCustomSupplement(id: string): Supplement[] {
  const all = getSupplements().filter((s) => s.id !== id || s.isDefault);
  saveCustomSupplements(all);
  // Also remove any logs for this supplement
  const logs = getSupplementLogs().filter((l) => l.supplementId !== id);
  saveSupplementLogs(logs);
  return all;
}

export function getSupplementLogs(): SupplementLog[] {
  return readJSON<SupplementLog[]>(SUPPLEMENT_LOGS_KEY, []);
}

export function saveSupplementLogs(logs: SupplementLog[]): void {
  writeJSON(SUPPLEMENT_LOGS_KEY, logs);
}

export function toggleSupplementLog(supplementId: string, date: string): SupplementLog[] {
  const logs = getSupplementLogs();
  const existing = logs.findIndex((l) => l.supplementId === supplementId && l.date === date);
  if (existing >= 0) {
    logs.splice(existing, 1);
  } else {
    logs.push({ supplementId, date });
  }
  saveSupplementLogs(logs);
  return logs;
}

export function getCheckedSupplementIds(date: string): Set<string> {
  return new Set(
    getSupplementLogs()
      .filter((l) => l.date === date)
      .map((l) => l.supplementId)
  );
}

export function getCheckedSupplements(date: string): Supplement[] {
  const checkedIds = getCheckedSupplementIds(date);
  return getSupplements().filter((s) => checkedIds.has(s.id));
}

export function createSupplement(input: {
  name: string;
  dose: string;
  timing: TimingSlot;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  micros?: Partial<typeof EMPTY_MICROS>;
}): Supplement {
  return {
    id: generateId(),
    name: input.name,
    dose: input.dose,
    timing: input.timing,
    isDefault: false,
    isCustom: true,
    calories: input.calories || 0,
    protein: input.protein || 0,
    carbs: input.carbs || 0,
    fat: input.fat || 0,
    micros: { ...EMPTY_MICROS, ...(input.micros || {}) },
  };
}
