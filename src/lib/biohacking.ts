import type { Meal, Supplement, Micros } from './types';
import type { NutrientKey } from './nutrients';

export type InsightType = 'synergy' | 'warning' | 'optimal' | 'antagonism' | 'peak';

export interface BiohackingInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  details?: string;
}

interface AnalysisContext {
  meals: Meal[];
  checkedSupplements: Supplement[];
}

function getMicroValue(micros: Micros, key: NutrientKey): number {
  return (micros as unknown as Record<string, number>)[key] || 0;
}

export function analyzeBiohacking(ctx: AnalysisContext): BiohackingInsight[] {
  const { meals, checkedSupplements } = ctx;
  const insights: BiohackingInsight[] = [];

  // Aggregate all nutrients from meals + checked supplements
  const allItems = [
    ...meals.map((m) => ({ name: m.foodText, protein: m.protein, fat: m.fat, micros: m.micros, time: m.time, isMeal: true })),
    ...checkedSupplements.map((s) => ({ name: s.name, protein: s.protein, fat: s.fat, micros: s.micros, time: '', isMeal: false })),
  ];

  const totalIron = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'eisen_mg'), 0);
  const totalVitC = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'vitamin_c_mg'), 0);
  const totalVitD = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'vitamin_d_mcg'), 0);
  const totalVitK = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'vitamin_k_mcg'), 0);
  const totalVitA = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'vitamin_a_mcg'), 0);
  const totalVitE = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'vitamin_e_mg'), 0);
  const totalOmega3 = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'omega3_g'), 0);
  const totalZinc = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'zink_mg'), 0);
  const totalCalcium = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'calcium_mg'), 0);
  const totalMagnesium = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'magnesium_mg'), 0);
  const totalPolyphenols = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'polyphenole_mg'), 0);
  const totalFiber = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'ballaststoffe_g'), 0);

  // --- Rule: Iron + Vitamin C synergy ---
  if (totalIron > 3 && totalVitC > 20) {
    const ironSource = meals.find((m) => getMicroValue(m.micros, 'eisen_mg') > 2)?.foodText
      || checkedSupplements.find((s) => getMicroValue(s.micros, 'eisen_mg') > 0)?.name
      || 'Eisen';
    insights.push({
      id: 'iron_vitc_synergy',
      type: 'synergy',
      title: 'Eisen + Vitamin C Synergie',
      message: `Dein Eisen (aus ${ironSource}) kombiniert mit Vitamin C steigert die Eisenaufnahme um das bis zu 4-fache.`,
      details: 'Vitamin C reduziert Eisen von Fe³⁺ zu Fe²⁺, das deutlich besser bioverfügbar ist.',
    });
  }

  // --- Rule: Coffee/Polyphenols inhibit iron absorption ---
  // We detect "coffee" or "kaffee" in meal names, or high polyphenols with iron
  const coffeeMeals = meals.filter((m) =>
    /kaffee|coffee|espresso|cappuccino|latte/i.test(m.foodText)
  );
  if (coffeeMeals.length > 0 && meals.some((m) => getMicroValue(m.micros, 'eisen_mg') > 2)) {
    const coffeeTime = coffeeMeals[0].time;
    const ironMeal = meals.find((m) => getMicroValue(m.micros, 'eisen_mg') > 2);
    const closeInTime = ironMeal && Math.abs(
      parseInt(coffeeTime.split(':')[0]) - parseInt(ironMeal.time.split(':')[0])
    ) < 1;

    insights.push({
      id: 'coffee_iron_warning',
      type: 'warning',
      title: 'Koffein hemmt Nährstoffaufnahme',
      message: closeInTime
        ? `Kaffee (${coffeeTime}) und deine eisenreiche Mahlzeit (${ironMeal!.time}) liegen nah beieinander — Polyphenole/Tannine hemmen Eisen- & Calciumaufnahme. Halte 60 Min. Abstand.`
        : 'Kaffee/Polyphenole hemmen die Mikronährstoff-Aufnahme (besonders Eisen & Calcium). Halte 60 Min. Abstand zu Hauptmahlzeiten.',
      details: 'Tannine und Chlorogensäure im Kaffee komplexieren Mineralstoffe im Darm.',
    });
  } else if (totalPolyphenols > 200 && totalIron > 5) {
    insights.push({
      id: 'polyphenol_iron_warning',
      type: 'warning',
      title: 'Polyphenole hemmen Eisenaufnahme',
      message: 'Hohe Polyphenol-Zufuhr zusammen mit Eisen kann die Aufnahme reduzieren. Bei eisenreichen Mahlzeiten polyphenolreiche Lebensmittel (Kaffee, Tee, Rotwein) zeitversetzt konsumieren.',
    });
  }

  // --- Rule: Fat-soluble vitamins + fat ---
  const fatSolubleTotal = totalVitA + totalVitD + totalVitE + totalVitK;
  const hasFatInMeals = meals.some((m) => m.fat > 8);
  const hasFatSolubleSupp = checkedSupplements.some((s) =>
    getMicroValue(s.micros, 'vitamin_d_mcg') > 0 ||
    getMicroValue(s.micros, 'vitamin_k_mcg') > 0 ||
    getMicroValue(s.micros, 'vitamin_a_mcg') > 0 ||
    getMicroValue(s.micros, 'vitamin_e_mg') > 0
  );

  if ((fatSolubleTotal > 0 || hasFatSolubleSupp) && hasFatInMeals) {
    const suppNames = checkedSupplements
      .filter((s) =>
        getMicroValue(s.micros, 'vitamin_d_mcg') > 0 ||
        getMicroValue(s.micros, 'vitamin_k_mcg') > 0 ||
        getMicroValue(s.micros, 'vitamin_a_mcg') > 0 ||
        getMicroValue(s.micros, 'vitamin_e_mg') > 0
      )
      .map((s) => s.name);
    const sourceText = suppNames.length > 0 ? suppNames.join(', ') : 'fettlösliche Vitamine';

    insights.push({
      id: 'fatsoluble_fat_optimal',
      type: 'optimal',
      title: 'Fettlösliche Vitamine + Fett',
      message: `Optimal: ${sourceText} zusammen mit einer fetthaltigen Mahlzeit eingenommen — die Aufnahme wird deutlich verbessert.`,
      details: 'Vitamine A, D, E und K benötigen Gallensäuren und Fett für die Resorption im Darm.',
    });
  } else if (hasFatSolubleSupp && !hasFatInMeals) {
    insights.push({
      id: 'fatsoluble_nofat_warning',
      type: 'warning',
      title: 'Fettlösliche Vitamine ohne Fett',
      message: 'Vitamin D3/K2 oder andere fettlösliche Vitamine ohne fetthaltige Mahlzeit eingenommen — nimm sie zu einer Mahlzeit mit etwas Fett (Avocado, Nüsse, Öl).',
    });
  }

  // --- Rule: Zinc vs Calcium/Magnesium antagonism ---
  const hasZincSupp = checkedSupplements.some((s) => getMicroValue(s.micros, 'zink_mg') > 0);
  const hasZincMeal = totalZinc > 5;
  const hasHighCalcium = totalCalcium > 300;
  const hasHighMag = totalMagnesium > 200;

  if ((hasZincSupp || hasZincMeal) && (hasHighCalcium || hasHighMag)) {
    const antagonist = hasHighCalcium && hasHighMag ? 'Calcium und Magnesium' : hasHighCalcium ? 'Calcium' : 'Magnesium';
    insights.push({
      id: 'zinc_calcium_antagonism',
      type: 'antagonism',
      title: 'Zink vs. ' + antagonist,
      message: `Konkurrenz: Hohe Dosen ${antagonist} gleichzeitig mit Zink hemmen die Aufnahme über den Darm. Nimm Zink versetzt ein (idealerweise abends, ${antagonist} morgens/mittags).`,
      details: 'Diese Mineralstoffe nutzen teilweise denselben Transporter (ZIP/Divalent Metal Transporter).',
    });
  }

  // --- Rule: Omega-3 + fat-soluble vitamins synergy ---
  if (totalOmega3 > 1 && (totalVitD > 10 || totalVitK > 50)) {
    insights.push({
      id: 'omega3_vitd_synergy',
      type: 'synergy',
      title: 'Omega-3 + Vitamin D3/K2',
      message: 'Omega-3-Fettsäuren verbessern die Bioverfügbarkeit von Vitamin D3 und K2 und wirken synergistisch entzündungshemmend.',
    });
  }

  // --- Rule: Protein distribution / Leucine threshold ---
  const highProteinMeals = meals.filter((m) => m.protein >= 30);
  if (highProteinMeals.length > 0) {
    const latest = highProteinMeals[highProteinMeals.length - 1];
    insights.push({
      id: 'leucine_peak',
      type: 'peak',
      title: 'Anaboler Peak ausgelöst',
      message: `Deine Mahlzeit "${latest.foodText}" (${latest.time}, ${Math.round(latest.protein)}g Protein) überschreitet die Leucin-Schwelle (~3g Leucin / 30g Protein) — Muskelproteinsynthese maximal getriggert.`,
      details: 'Alle 3-4 Stunden eine Mahlzeit mit 30-40g Protein optimiert die MPS über den Tag.',
    });
  }

  // --- Rule: Fiber + Minerals timing ---
  if (totalFiber > 20 && (hasZincSupp || totalIron > 5)) {
    insights.push({
      id: 'fiber_mineral_timing',
      type: 'warning',
      title: 'Ballaststoffe & Mineralstoff-Aufnahme',
      message: 'Sehr hohe Ballaststoffzufuhr kann die Aufnahme von Zink und Eisen leicht reduzieren. Bei Supplementen etwas Abstand zu extrem faserreichen Mahlzeiten halten.',
    });
  }

  // --- Rule: Magnesium + B6 synergy ---
  const hasMagSupp = checkedSupplements.some((s) => getMicroValue(s.micros, 'magnesium_mg') > 0);
  const hasB6 = allItems.reduce((sum, i) => sum + getMicroValue(i.micros, 'vitamin_b6_mg'), 0) > 0.5;
  if (hasMagSupp && hasB6) {
    insights.push({
      id: 'mag_b6_synergy',
      type: 'synergy',
      title: 'Magnesium + Vitamin B6',
      message: 'Vitamin B6 verbessert den zellulären Transport von Magnesium und wirkt synergistisch bei Muskelentspannung und Nervenfunktion.',
    });
  }

  return insights;
}
