import type { MealNutrition, Micros } from './types';
import { EMPTY_MICROS } from './types';
import { NUTRIENT_KEYS } from './nutrients';

interface OFFNutrients {
  [key: string]: string | undefined;
}

interface OFFProduct {
  product_name?: string;
  product_name_de?: string;
  serving_size?: string;
  serving_quantity?: string;
  nutriments?: OFFNutrients;
}

interface OFFResponse {
  status?: number;
  product?: OFFProduct;
}

// Open Food Facts uses per-100g values, stored under specific field names
// Map OFF nutrient keys to our NutrientKey. Values in OFF are per 100g/ml in the unit shown.
const OFF_NUTRIENT_MAP: Record<string, keyof Micros> = {
  'vitamin-a': 'vitamin_a_mcg',
  'vitamin-b1': 'vitamin_b1_mg',
  'vitamin-b2': 'vitamin_b2_mg',
  'vitamin-b3': 'vitamin_b3_mg',
  'vitamin-b6': 'vitamin_b6_mg',
  'vitamin-b9': 'vitamin_b9_mcg',
  'vitamin-b12': 'vitamin_b12_mcg',
  'vitamin-c': 'vitamin_c_mg',
  'vitamin-d': 'vitamin_d_mcg',
  'vitamin-e': 'vitamin_e_mg',
  'vitamin-k': 'vitamin_k_mcg',
  'magnesium': 'magnesium_mg',
  'zinc': 'zink_mg',
  'potassium': 'kalium_mg',
  'iron': 'eisen_mg',
  'calcium': 'calcium_mg',
  'sodium': 'natrium_mg',
  'selenium': 'selen_mcg',
  'iodine': 'jod_mcg',
  'copper': 'kupfer_mg',
  'fiber': 'ballaststoffe_g',
  'omega-3-fat': 'omega3_g',
};

export interface OpenFoodFactsResult {
  productName: string;
  servingSize?: string;
  nutrition: MealNutrition;
}

function toNum(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export async function lookupBarcode(barcode: string): Promise<OpenFoodFactsResult> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,product_name_de,serving_size,serving_quantity,nutriments`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Food Facts Fehler (${response.status})`);
  }

  const data = await response.json() as OFFResponse;

  if (data.status !== 1 || !data.product) {
    throw new Error('Produkt nicht in Open Food Facts gefunden.');
  }

  const product = data.product;
  const productName = product.product_name_de || product.product_name || 'Unbekanntes Produkt';
  const servingSize = product.serving_size;
  const n = product.nutriments || {};

  // OFF values are per 100g. We'll return them as-is (per 100g/ml serving)
  const micros = { ...EMPTY_MICROS };

  for (const [offKey, ourKey] of Object.entries(OFF_NUTRIENT_MAP)) {
    const val = n[offKey];
    if (val !== undefined) {
      (micros as unknown as Record<string, number>)[ourKey] = toNum(val);
    }
  }

  const nutrition: MealNutrition = {
    calories: toNum(n['energy-kcal_100g'] || n['energy-kcal']),
    protein: toNum(n['proteins_100g'] || n['proteins']),
    carbs: toNum(n['carbohydrates_100g'] || n['carbohydrates']),
    fat: toNum(n['fat_100g'] || n['fat']),
    micros,
  };

  // Ensure all nutrient keys are present
  for (const key of NUTRIENT_KEYS) {
    if (typeof (micros as unknown as Record<string, unknown>)[key] !== 'number') {
      (micros as unknown as Record<string, unknown>)[key] = 0;
    }
  }

  return { productName, servingSize, nutrition };
}
