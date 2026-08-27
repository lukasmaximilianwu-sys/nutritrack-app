import type { NutrientKey } from './nutrients';
import type { Goals, DailyTotals } from './types';
import { NUTRIENT_KEYS, NUTRIENT_MAP } from './nutrients';

const NUTS_KEY = 'nutritrack_nuts';
const SHOP_KEY = 'nutritrack_shop';
const STREAK_KEY = 'nutritrack_streak';
const NUTS_AWARDED_KEY = 'nutritrack_nuts_awarded';

// --- Nuts currency ---

export function getNuts(): number {
  try {
    return parseInt(localStorage.getItem(NUTS_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveNuts(amount: number): void {
  localStorage.setItem(NUTS_KEY, String(Math.max(0, Math.floor(amount))));
}

export function addNuts(amount: number): number {
  const current = getNuts();
  const updated = current + amount;
  saveNuts(updated);
  return updated;
}

export function spendNuts(amount: number): boolean {
  const current = getNuts();
  if (current < amount) return false;
  saveNuts(current - amount);
  return true;
}

// --- Daily awarding: 1 nut per nutrient goal met ---

export function getAwardedNutrients(date: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${NUTS_AWARDED_KEY}_${date}`);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveAwardedNutrients(date: string, keys: Set<string>): void {
  localStorage.setItem(`${NUTS_AWARDED_KEY}_${date}`, JSON.stringify([...keys]));
}

export function checkAndAwardNuts(totals: DailyTotals, goals: Goals, date: string): {
  newlyAwarded: { key: string; label: string; amount: number }[];
  totalAwarded: number;
} {
  const alreadyAwarded = getAwardedNutrients(date);
  const newlyAwarded: { key: string; label: string; amount: number }[] = [];

  // Check macros
  const macroKeys: { key: string; label: string; value: number; goal: number }[] = [
    { key: 'calories', label: 'Kalorien', value: totals.calories, goal: goals.calories },
    { key: 'protein', label: 'Protein', value: totals.protein, goal: goals.protein },
    { key: 'carbs', label: 'Carbs', value: totals.carbs, goal: goals.carbs },
    { key: 'fat', label: 'Fett', value: totals.fat, goal: goals.fat },
  ];

  for (const macro of macroKeys) {
    if (macro.goal > 0 && macro.value >= macro.goal && !alreadyAwarded.has(macro.key)) {
      alreadyAwarded.add(macro.key);
      newlyAwarded.push({ key: macro.key, label: macro.label, amount: 1 });
    }
  }

  // Check micros
  for (const key of NUTRIENT_KEYS) {
    const value = (totals.micros as unknown as Record<string, number>)[key];
    const goal = (goals as unknown as Record<string, number>)[key];
    if (goal > 0 && value >= goal && !alreadyAwarded.has(key)) {
      alreadyAwarded.add(key);
      newlyAwarded.push({ key, label: NUTRIENT_MAP[key].label, amount: 1 });
    }
  }

  if (newlyAwarded.length > 0) {
    saveAwardedNutrients(date, alreadyAwarded);
    addNuts(newlyAwarded.length);
  }

  return { newlyAwarded, totalAwarded: alreadyAwarded.size };
}

// --- Streak system ---

export interface StreakData {
  currentStreak: number;
  lastFullDay: string | null;
  bestStreak: number;
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { currentStreak: 0, lastFullDay: null, bestStreak: 0 };
    return JSON.parse(raw) as StreakData;
  } catch {
    return { currentStreak: 0, lastFullDay: null, bestStreak: 0 };
  }
}

export function saveStreak(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function checkStreakDay(totals: DailyTotals, goals: Goals): boolean {
  return (
    goals.calories > 0 && totals.calories >= goals.calories &&
    goals.protein > 0 && totals.protein >= goals.protein &&
    goals.carbs > 0 && totals.carbs >= goals.carbs &&
    goals.fat > 0 && totals.fat >= goals.fat
  );
}

export function updateStreak(totals: DailyTotals, goals: Goals, date: string): StreakData {
  const streak = getStreak();
  const allMacrosMet = checkStreakDay(totals, goals);

  // Already counted today
  if (streak.lastFullDay === date) {
    return streak;
  }

  if (!allMacrosMet) {
    // Streak broken if last full day was before yesterday
    if (streak.lastFullDay) {
      const last = new Date(streak.lastFullDay);
      const today = new Date(date);
      const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 1) {
        const broken: StreakData = { currentStreak: 0, lastFullDay: streak.lastFullDay, bestStreak: streak.bestStreak };
        saveStreak(broken);
        return broken;
      }
    }
    return streak;
  }

  // All macros met and not yet counted
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const newStreak = streak.lastFullDay === yesterdayStr
    ? streak.currentStreak + 1
    : 1;

  const updated: StreakData = {
    currentStreak: newStreak,
    lastFullDay: date,
    bestStreak: Math.max(streak.bestStreak, newStreak),
  };
  saveStreak(updated);
  return updated;
}

export function getStreakLevel(streak: number): {
  name: string;
  color: string;
  glow: string;
  ring: string;
} {
  if (streak >= 8) {
    return {
      name: 'Apex Matrix',
      color: 'text-amber-400',
      glow: 'shadow-amber-500/40',
      ring: 'ring-amber-500/30',
    };
  } else if (streak >= 4) {
    return {
      name: 'Overdrive Core',
      color: 'text-emerald-400',
      glow: 'shadow-emerald-500/40',
      ring: 'ring-emerald-500/30',
    };
  } else if (streak >= 1) {
    return {
      name: 'Alpha Core',
      color: 'text-blue-400',
      glow: 'shadow-blue-500/40',
      ring: 'ring-blue-500/30',
    };
  }
  return {
    name: 'Inaktiv',
    color: 'text-slate-500',
    glow: 'shadow-slate-500/20',
    ring: 'ring-slate-700/30',
  };
}

// --- Shop ---

export type ShopCategory = 'theme' | 'badge' | 'fx';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ShopCategory;
  icon: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Themes
  { id: 'theme_cyberpunk_gold', name: 'Cyberpunk Gold', description: 'Goldene Akzente auf dunklem Obsidian', price: 150, category: 'theme', icon: 'Crown' },
  { id: 'theme_neon_mint', name: 'Neon Mint', description: 'Frische Mint-Grün Akzente im gesamten UI', price: 80, category: 'theme', icon: 'Sparkle' },
  { id: 'theme_obsidian_dark', name: 'Obsidian Dark', description: 'Minimalistisch, extra dunkel, Premium-Look', price: 50, category: 'theme', icon: 'Moon' },

  // Badges
  { id: 'badge_biohacking_apex', name: 'Biohacking Apex', description: 'Titel für Biohacking-Meister', price: 100, category: 'badge', icon: 'Zap' },
  { id: 'badge_micro_maxxer', name: 'Micro-Maxxer', description: 'Alle Mikros an einem Tag —.legendär', price: 60, category: 'badge', icon: 'Atom' },
  { id: 'badge_nuss_baron', name: 'Nuss-Baron', description: '500+ Nüsse gesammelt', price: 80, category: 'badge', icon: 'Coins' },

  // FX
  { id: 'fx_golden_confetti', name: 'Golden Confetti', description: 'Goldene Konfetti-Explosion bei Zielerreichung', price: 40, category: 'fx', icon: 'Star' },
  { id: 'fx_cyber_sparkles', name: 'Cyber-Sparkles', description: 'Neon-Funken-Effekt beim Abhaken von Supplements', price: 40, category: 'fx', icon: 'Wand' },
];

export interface ShopState {
  purchased: string[];
  activeTheme: string | null;
  activeBadge: string | null;
  activeFx: string | null;
}

export function getShopState(): ShopState {
  try {
    const raw = localStorage.getItem(SHOP_KEY);
    if (!raw) return { purchased: [], activeTheme: null, activeBadge: null, activeFx: null };
    return JSON.parse(raw) as ShopState;
  } catch {
    return { purchased: [], activeTheme: null, activeBadge: null, activeFx: null };
  }
}

export function saveShopState(state: ShopState): void {
  localStorage.setItem(SHOP_KEY, JSON.stringify(state));
}

export function purchaseItem(itemId: string): { success: boolean; error?: string } {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { success: false, error: 'Item nicht gefunden.' };

  const state = getShopState();
  if (state.purchased.includes(itemId)) return { success: false, error: 'Bereits gekauft.' };

  if (!spendNuts(item.price)) return { success: false, error: 'Nicht genug Nüsse.' };

  state.purchased.push(itemId);
  // Auto-activate if it's the first in its category
  if (item.category === 'theme' && !state.activeTheme) state.activeTheme = itemId;
  if (item.category === 'badge' && !state.activeBadge) state.activeBadge = itemId;
  if (item.category === 'fx' && !state.activeFx) state.activeFx = itemId;

  saveShopState(state);
  return { success: true };
}

export function activateItem(itemId: string): void {
  const state = getShopState();
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item || !state.purchased.includes(itemId)) return;

  if (item.category === 'theme') state.activeTheme = itemId;
  if (item.category === 'badge') state.activeBadge = itemId;
  if (item.category === 'fx') state.activeFx = itemId;

  saveShopState(state);
}

// --- Backup/Restore ---

export interface BackupData {
  version: number;
  exportedAt: string;
  meals: unknown[];
  weights: unknown[];
  settings: unknown;
  supplements: unknown[];
  supplementLogs: unknown[];
  nuts: number;
  shopState: ShopState;
  streak: StreakData;
}

export function exportAllData(): string {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    meals: JSON.parse(localStorage.getItem('nutritrack_meals') || '[]'),
    weights: JSON.parse(localStorage.getItem('nutritrack_weights') || '[]'),
    settings: JSON.parse(localStorage.getItem('nutritrack_settings') || '{}'),
    supplements: JSON.parse(localStorage.getItem('nutritrack_supplements') || '[]'),
    supplementLogs: JSON.parse(localStorage.getItem('nutritrack_supplement_logs') || '[]'),
    nuts: getNuts(),
    shopState: getShopState(),
    streak: getStreak(),
  };
  return JSON.stringify(data, null, 2);
}

export function validateBackup(raw: string): { valid: boolean; error?: string; data?: BackupData } {
  try {
    const parsed = JSON.parse(raw) as BackupData;
    if (typeof parsed.version !== 'number') {
      return { valid: false, error: 'Ungültiges Backup-Format: Version fehlt.' };
    }
    if (!Array.isArray(parsed.meals) || !Array.isArray(parsed.weights)) {
      return { valid: false, error: 'Ungültiges Backup-Format: Daten fehlen.' };
    }
    return { valid: true, data: parsed };
  } catch {
    return { valid: false, error: 'Datei konnte nicht als JSON gelesen werden.' };
  }
}

export function importAllData(data: BackupData): void {
  localStorage.setItem('nutritrack_meals', JSON.stringify(data.meals));
  localStorage.setItem('nutritrack_weights', JSON.stringify(data.weights));
  if (data.settings) localStorage.setItem('nutritrack_settings', JSON.stringify(data.settings));
  if (data.supplements) localStorage.setItem('nutritrack_supplements', JSON.stringify(data.supplements));
  if (data.supplementLogs) localStorage.setItem('nutritrack_supplement_logs', JSON.stringify(data.supplementLogs));
  if (typeof data.nuts === 'number') saveNuts(data.nuts);
  if (data.shopState) saveShopState(data.shopState);
  if (data.streak) saveStreak(data.streak);
}
