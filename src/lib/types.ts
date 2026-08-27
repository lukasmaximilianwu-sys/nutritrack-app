import type { NutrientKey } from './nutrients';
import type { PhaseMode } from './phases';

export interface Micros {
  vitamin_a_mcg: number;
  vitamin_b1_mg: number;
  vitamin_b2_mg: number;
  vitamin_b3_mg: number;
  vitamin_b5_mg: number;
  vitamin_b6_mg: number;
  vitamin_b7_mcg: number;
  vitamin_b9_mcg: number;
  vitamin_b12_mcg: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
  vitamin_e_mg: number;
  vitamin_k_mcg: number;
  magnesium_mg: number;
  zink_mg: number;
  kalium_mg: number;
  eisen_mg: number;
  calcium_mg: number;
  natrium_mg: number;
  selen_mcg: number;
  jod_mcg: number;
  kupfer_mg: number;
  polyphenole_mg: number;
  flavonoide_mg: number;
  lycopin_mg: number;
  sulforaphan_mg: number;
  carotinoide_mg: number;
  omega3_g: number;
  ballaststoffe_g: number;
}

export type Goals = Record<NutrientKey, number> & {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export interface MealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micros: Micros;
}

export interface Meal extends MealNutrition {
  id: string;
  foodText: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
}

export interface Settings {
  apiKey: string;
  goals: Goals;
  phaseMode: PhaseMode;
}

export const EMPTY_MICROS: Micros = {
  vitamin_a_mcg: 0,
  vitamin_b1_mg: 0,
  vitamin_b2_mg: 0,
  vitamin_b3_mg: 0,
  vitamin_b5_mg: 0,
  vitamin_b6_mg: 0,
  vitamin_b7_mcg: 0,
  vitamin_b9_mcg: 0,
  vitamin_b12_mcg: 0,
  vitamin_c_mg: 0,
  vitamin_d_mcg: 0,
  vitamin_e_mg: 0,
  vitamin_k_mcg: 0,
  magnesium_mg: 0,
  zink_mg: 0,
  kalium_mg: 0,
  eisen_mg: 0,
  calcium_mg: 0,
  natrium_mg: 0,
  selen_mcg: 0,
  jod_mcg: 0,
  kupfer_mg: 0,
  polyphenole_mg: 0,
  flavonoide_mg: 0,
  lycopin_mg: 0,
  sulforaphan_mg: 0,
  carotinoide_mg: 0,
  omega3_g: 0,
  ballaststoffe_g: 0,
};

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  micros: Micros;
}

// --- Supplements ---

export type TimingSlot = 'morgens' | 'mittags' | 'abends' | 'vor_dem_schlafen';

export interface Supplement extends MealNutrition {
  id: string;
  name: string;
  dose: string;
  timing: TimingSlot;
  isDefault: boolean;
  isCustom: boolean;
}

export interface SupplementLog {
  supplementId: string;
  date: string; // YYYY-MM-DD
}
