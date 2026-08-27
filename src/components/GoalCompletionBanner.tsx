import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

export interface GoalCompletion {
  id: number;
  label: string;
  value: string;
  nuts: number;
}

interface GoalCompletionBannerProps {
  completions: GoalCompletion[];
  onDismiss: (id: number) => void;
}

export default function GoalCompletionBanner({ completions, onDismiss }: GoalCompletionBannerProps) {
  const [visibleIds, setVisibleIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    for (const c of completions) {
      if (!visibleIds.has(c.id)) {
        setVisibleIds((prev) => new Set(prev).add(c.id));
        setTimeout(() => {
          setVisibleIds((prev) => {
            const next = new Set(prev);
            next.delete(c.id);
            return next;
          });
          onDismiss(c.id);
        }, 4000);
      }
    }
  }, [completions, visibleIds, onDismiss]);

  if (completions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-16 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {completions.map((c) => {
        if (!visibleIds.has(c.id)) return null;
        return (
          <div
            key={c.id}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-3 shadow-2xl shadow-emerald-500/30 ring-2 ring-emerald-400/50"
            style={{
              animation: 'goalPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Confetti burst */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-300/50" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Check className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-sm font-semibold text-white">
              Ziel erreicht: {c.label} {c.value}!
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-xs font-bold text-white">
              <Sparkles className="h-3.5 w-3.5" />
              +{c.nuts} 🥜
            </div>
          </div>
        );
      })}
    </div>
  );
}
