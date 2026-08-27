import type { Goals } from './types';
import type { NutrientKey } from './nutrients';
import { NUTRIENT_GOALS } from './nutrients';

export type PhaseMode = 'bulk' | 'cut' | 'recomp';

export interface PhasePreset {
  mode: PhaseMode;
  label: string;
  shortLabel: string;
  description: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  focusNutrients: NutrientKey[];
  focusDescription: string;
  icon: string;
  accentColor: string;
}

export const PHASE_PRESETS: PhasePreset[] = [
  {
    mode: 'bulk',
    label: 'Bulk (Aufbau)',
    shortLabel: 'Bulk',
    description: 'Kalorienüberschuss für maximalen Muskelaufbau',
    macros: { calories: 3000, protein: 180, carbs: 380, fat: 90 },
    focusNutrients: ['kalium_mg', 'zink_mg', 'magnesium_mg', 'vitamin_b6_mg', 'eisen_mg'],
    focusDescription: 'Kalium & Zink für Muskelfunktion und Regeneration, B6 für Proteinsynthese',
    icon: 'TrendingUp',
    accentColor: 'text-emerald-400',
  },
  {
    mode: 'cut',
    label: 'Cut (Definitionsphase)',
    shortLabel: 'Cut',
    description: 'Kaloriendefizit für Fettverlust bei Muskelhaltung',
    macros: { calories: 2000, protein: 170, carbs: 180, fat: 60 },
    focusNutrients: ['vitamin_b1_mg', 'vitamin_b2_mg', 'vitamin_b3_mg', 'vitamin_b5_mg', 'vitamin_b6_mg', 'magnesium_mg', 'ballaststoffe_g'],
    focusDescription: 'B-Vitamine für Stoffwechsel & Energie, Magnesium für Sättigung & Muskelfunktion',
    icon: 'Flame',
    accentColor: 'text-orange-400',
  },
  {
    mode: 'recomp',
    label: 'Muskelaufbau / Recomp',
    shortLabel: 'Recomp',
    description: 'Erhaltungskalorien mit hohem Protein für gleichzeitigen Aufbau & Fettabbau',
    macros: { calories: 2400, protein: 200, carbs: 280, fat: 75 },
    focusNutrients: ['zink_mg', 'vitamin_d_mcg', 'omega3_g', 'magnesium_mg', 'vitamin_b12_mcg', 'selen_mcg'],
    focusDescription: 'Zink & Vitamin D für Hormonbalance, Omega-3 für Entzündungsregulation',
    icon: 'Dumbbell',
    accentColor: 'text-cyan-400',
  },
];

export const PHASE_MAP = Object.fromEntries(
  PHASE_PRESETS.map((p) => [p.mode, p])
) as Record<PhaseMode, PhasePreset>;

export function getPhaseGoals(mode: PhaseMode): Goals {
  const preset = PHASE_MAP[mode];
  return {
    ...preset.macros,
    ...NUTRIENT_GOALS,
  };
}

export function getPhasePreset(mode: PhaseMode): PhasePreset {
  return PHASE_MAP[mode];
}
