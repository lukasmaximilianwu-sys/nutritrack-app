export type NutrientKey =
  | 'vitamin_a_mcg' | 'vitamin_b1_mg' | 'vitamin_b2_mg' | 'vitamin_b3_mg' | 'vitamin_b5_mg'
  | 'vitamin_b6_mg' | 'vitamin_b7_mcg' | 'vitamin_b9_mcg' | 'vitamin_b12_mcg' | 'vitamin_c_mg'
  | 'vitamin_d_mcg' | 'vitamin_e_mg' | 'vitamin_k_mcg'
  | 'magnesium_mg' | 'zink_mg' | 'kalium_mg' | 'eisen_mg' | 'calcium_mg' | 'natrium_mg'
  | 'selen_mcg' | 'jod_mcg' | 'kupfer_mg'
  | 'polyphenole_mg' | 'flavonoide_mg' | 'lycopin_mg' | 'sulforaphan_mg'
  | 'carotinoide_mg' | 'omega3_g' | 'ballaststoffe_g';

export interface NutrientMeta {
  key: NutrientKey;
  label: string;
  shortLabel: string;
  unit: string;
  goal: number;
  color: string;
  description: string;
  foods: string;
  group: 'vitamine' | 'mineralstoffe' | 'bioaktiv';
}

export const NUTRIENT_METADATA: NutrientMeta[] = [
  // --- Vitamine ---
  { key: 'vitamin_a_mcg', label: 'Vitamin A', shortLabel: 'Vit A', unit: 'µg', goal: 800, color: 'bg-orange-400', description: 'Sehkraft, Immunsystem & Hautgesundheit', foods: 'Leber, Süßkartoffeln, Karotten, Spinat', group: 'vitamine' },
  { key: 'vitamin_b1_mg', label: 'Vitamin B1 (Thiamin)', shortLabel: 'B1', unit: 'mg', goal: 1.2, color: 'bg-amber-400', description: 'Energiestoffwechsel & Nervenfunktion', foods: 'Schweinefleisch, Sonnenblumenkerne, Vollkorn', group: 'vitamine' },
  { key: 'vitamin_b2_mg', label: 'Vitamin B2 (Riboflavin)', shortLabel: 'B2', unit: 'mg', goal: 1.4, color: 'bg-yellow-400', description: 'Energiegewinnung & Schleimhautgesundheit', foods: 'Milchprodukte, Mandeln, Pilze, Eier', group: 'vitamine' },
  { key: 'vitamin_b3_mg', label: 'Vitamin B3 (Niacin)', shortLabel: 'B3', unit: 'mg', goal: 16, color: 'bg-lime-400', description: 'Zellenergie & DNA-Reparatur', foods: 'Hähnchen, Thunfisch, Erdnüsse, Pilze', group: 'vitamine' },
  { key: 'vitamin_b5_mg', label: 'Vitamin B5 (Pantothensäure)', shortLabel: 'B5', unit: 'mg', goal: 6, color: 'bg-green-400', description: 'Coenzym-A-Synthese & Stoffwechsel', foods: 'Leber, Avocado, Champignons, Linsen', group: 'vitamine' },
  { key: 'vitamin_b6_mg', label: 'Vitamin B6 (Pyridoxin)', shortLabel: 'B6', unit: 'mg', goal: 1.4, color: 'bg-emerald-400', description: 'Aminosäurestoffwechsel & Neurotransmitter', foods: 'Lachs, Bananen, Kichererbsen, Kartoffeln', group: 'vitamine' },
  { key: 'vitamin_b7_mcg', label: 'Vitamin B7 (Biotin)', shortLabel: 'B7', unit: 'µg', goal: 40, color: 'bg-teal-400', description: 'Haar, Haut, Nägel & Genexpression', foods: 'Eier, Leber, Nüsse, Soja', group: 'vitamine' },
  { key: 'vitamin_b9_mcg', label: 'Vitamin B9 (Folsäure)', shortLabel: 'B9', unit: 'µg', goal: 400, color: 'bg-cyan-400', description: 'Zellteilung, DNA-Synthese & Schwangerschaft', foods: 'Grünblättriges Gemüse, Linsen, Spargel, Avocado', group: 'vitamine' },
  { key: 'vitamin_b12_mcg', label: 'Vitamin B12 (Cobalamin)', shortLabel: 'B12', unit: 'µg', goal: 4, color: 'bg-sky-400', description: 'Blutbildung & Nervensystem', foods: 'Lachs, Thunfisch, Eier, Milchprodukte', group: 'vitamine' },
  { key: 'vitamin_c_mg', label: 'Vitamin C', shortLabel: 'Vit C', unit: 'mg', goal: 100, color: 'bg-yellow-500', description: 'Antioxidans, Immunsystem & Kollagensynthese', foods: 'Rote Paprika, Kiwi, Brokkoli, Orangen', group: 'vitamine' },
  { key: 'vitamin_d_mcg', label: 'Vitamin D', shortLabel: 'Vit D', unit: 'µg', goal: 20, color: 'bg-amber-500', description: 'Knochen, Kalziumaufnahme & Immunsystem', foods: 'Lachs, Hering, Eigelb, Pilze', group: 'vitamine' },
  { key: 'vitamin_e_mg', label: 'Vitamin E', shortLabel: 'Vit E', unit: 'mg', goal: 14, color: 'bg-orange-500', description: 'Zellschutz & antioxidative Abwehr', foods: 'Sonnenblumenöl, Mandeln, Haselnüsse, Avocado', group: 'vitamine' },
  { key: 'vitamin_k_mcg', label: 'Vitamin K', shortLabel: 'Vit K', unit: 'µg', goal: 70, color: 'bg-lime-500', description: 'Blutgerinnung & Knochenstoffwechsel', foods: 'Grünkohl, Spinat, Brokkoli, Rosenkohl', group: 'vitamine' },

  // --- Mineralstoffe ---
  { key: 'magnesium_mg', label: 'Magnesium', shortLabel: 'Mg', unit: 'mg', goal: 400, color: 'bg-violet-500', description: 'Muskelentspannung & Nervenfunktion', foods: 'Kürbiskerne, Mandeln, Spinat, dunkle Schokolade', group: 'mineralstoffe' },
  { key: 'zink_mg', label: 'Zink', shortLabel: 'Zn', unit: 'mg', goal: 15, color: 'bg-teal-500', description: 'Immunsystem & Testosteronsynthese', foods: 'Rindfleisch, Kürbiskerne, Linsen, Haferflocken', group: 'mineralstoffe' },
  { key: 'kalium_mg', label: 'Kalium', shortLabel: 'K', unit: 'mg', goal: 3500, color: 'bg-pink-500', description: 'Herzrhythmus & Blutdruckregulation', foods: 'Bananen, Kartoffeln, Süßkartoffeln, weiße Bohnen', group: 'mineralstoffe' },
  { key: 'eisen_mg', label: 'Eisen', shortLabel: 'Fe', unit: 'mg', goal: 10, color: 'bg-rose-500', description: 'Sauerstofftransport & Blutbildung', foods: 'Rotes Fleisch, Linsen, Spinat, Hirse', group: 'mineralstoffe' },
  { key: 'calcium_mg', label: 'Calcium', shortLabel: 'Ca', unit: 'mg', goal: 1000, color: 'bg-slate-400', description: 'Knochen, Zähne & Muskelkontraktion', foods: 'Milchprodukte, Sesam, Grünkohl, Mandeln', group: 'mineralstoffe' },
  { key: 'natrium_mg', label: 'Natrium', shortLabel: 'Na', unit: 'mg', goal: 1500, color: 'bg-blue-400', description: 'Flüssigkeitshaushalt & Nervenfunktion', foods: 'Meersalz, Sellerie, Rote Bete, Karotten', group: 'mineralstoffe' },
  { key: 'selen_mcg', label: 'Selen', shortLabel: 'Se', unit: 'µg', goal: 55, color: 'bg-indigo-400', description: 'Schilddrüse & antioxidativer Schutz', foods: 'Brasilnüsse, Fisch, Eier, Linsen', group: 'mineralstoffe' },
  { key: 'jod_mcg', label: 'Jod', shortLabel: 'I', unit: 'µg', goal: 150, color: 'bg-fuchsia-400', description: 'Schilddrüsenhormone & Stoffwechsel', foods: 'Seetang, Seefisch, Jodsalz, Milch', group: 'mineralstoffe' },
  { key: 'kupfer_mg', label: 'Kupfer', shortLabel: 'Cu', unit: 'mg', goal: 1.1, color: 'bg-orange-300', description: 'Eisenstoffwechsel & Bindegewebssynthese', foods: 'Leber, Cashews, Sesam, Kakao', group: 'mineralstoffe' },

  // --- Bioaktive Stoffe ---
  { key: 'polyphenole_mg', label: 'Polyphenole', shortLabel: 'Polyph', unit: 'mg', goal: 500, color: 'bg-purple-400', description: 'Antioxidans & entzündungshemmend', foods: 'Beeren, grüner Tee, dunkle Schokolade, Rotwein', group: 'bioaktiv' },
  { key: 'flavonoide_mg', label: 'Flavonoide', shortLabel: 'Flav', unit: 'mg', goal: 250, color: 'bg-violet-400', description: 'Gefäßschutz & antioxidative Wirkung', foods: 'Zitrusfrüchte, Blaubeeren, Zwiebeln, Petersilie', group: 'bioaktiv' },
  { key: 'lycopin_mg', label: 'Lycopin', shortLabel: 'Lycop', unit: 'mg', goal: 8, color: 'bg-red-400', description: 'Zellschutz & Prostatagesundheit', foods: 'Tomaten, Tomatenmark, Wassermelone, Guave', group: 'bioaktiv' },
  { key: 'sulforaphan_mg', label: 'Sulforaphan', shortLabel: 'Sulf', unit: 'mg', goal: 10, color: 'bg-green-500', description: 'Zellschutz & Entgiftungsenzyme', foods: 'Brokkoli, Rosenkohl, Rucola, Kohlrabi', group: 'bioaktiv' },
  { key: 'carotinoide_mg', label: 'Carotinoide', shortLabel: 'Carot', unit: 'mg', goal: 6, color: 'bg-amber-300', description: 'Augengesundheit & antioxidativer Schutz', foods: 'Karotten, Süßkartoffeln, Spinat, Tomaten', group: 'bioaktiv' },
  { key: 'omega3_g', label: 'Omega-3', shortLabel: 'O3', unit: 'g', goal: 2, color: 'bg-cyan-500', description: 'Entzündungshemmend & Herz-Kreislauf-Schutz', foods: 'Lachs, Leinsamen, Walnüsse, Chiasamen', group: 'bioaktiv' },
  { key: 'ballaststoffe_g', label: 'Ballaststoffe', shortLabel: 'Ballast', unit: 'g', goal: 30, color: 'bg-stone-400', description: 'Darmgesundheit & Blutzuckerregulation', foods: 'Haferflocken, Linsen, Flohsamenschalen, Gemüse', group: 'bioaktiv' },
];

export const NUTRIENT_KEYS = NUTRIENT_METADATA.map((m) => m.key);

export const NUTRIENT_MAP = Object.fromEntries(
  NUTRIENT_METADATA.map((m) => [m.key, m])
) as Record<NutrientKey, NutrientMeta>;

export const NUTRIENT_GOALS = Object.fromEntries(
  NUTRIENT_METADATA.map((m) => [m.key, m.goal])
) as Record<NutrientKey, number>;

export const NUTRIENT_FOODS = Object.fromEntries(
  NUTRIENT_METADATA.map((m) => [m.key, m.foods])
) as Record<NutrientKey, string>;

export const GROUP_LABELS: Record<NutrientMeta['group'], string> = {
  vitamine: 'Vitamine',
  mineralstoffe: 'Mineralstoffe',
  bioaktiv: 'Bioaktive Stoffe',
};

import type { Goals } from './types';

export const DEFAULT_GOALS: Goals = {
  calories: 2400,
  protein: 150,
  carbs: 300,
  fat: 75,
  ...NUTRIENT_GOALS,
};
