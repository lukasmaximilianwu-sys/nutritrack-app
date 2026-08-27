import { Trash2, Clock } from 'lucide-react';
import { deleteMeal } from '@/lib/storage';
import type { Meal } from '@/lib/types';

interface MealHistoryProps {
  meals: Meal[];
  onMealDeleted: () => void;
}

export default function MealHistory({ meals, onMealDeleted }: MealHistoryProps) {
  const handleDelete = (id: string) => {
    deleteMeal(id);
    onMealDeleted();
  };

  return (
    <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-100">Heutige Mahlzeiten</h2>

      {meals.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-600">Noch keine Mahlzeiten erfasst. Analysiere dein erstes Essen!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="group flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-900/30 p-3 transition-all hover:border-slate-600/50 hover:bg-slate-900/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{meal.foodText}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {meal.time}
                  </span>
                  <span>{Math.round(meal.calories)} kcal</span>
                  <span>{Math.round(meal.protein)}g Protein</span>
                  <span className="hidden sm:inline">{Math.round(meal.carbs)}g KH</span>
                  <span className="hidden sm:inline">{Math.round(meal.fat)}g Fett</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(meal.id)}
                className="ml-2 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-950/40 hover:text-rose-400 group-hover:text-slate-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
