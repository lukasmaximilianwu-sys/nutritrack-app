import { Zap, Clock, AlertTriangle, XCircle, Flame } from 'lucide-react';
import type { BiohackingInsight, InsightType } from '@/lib/biohacking';

interface BiohackingInsightsProps {
  insights: BiohackingInsight[];
}

const TYPE_CONFIG: Record<InsightType, {
  icon: React.ReactNode;
  ring: string;
  bg: string;
  iconColor: string;
  titleColor: string;
  label: string;
}> = {
  synergy: {
    icon: <Zap className="h-5 w-5" />,
    ring: 'ring-emerald-800/40',
    bg: 'bg-emerald-950/30',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-300',
    label: 'Synergie',
  },
  optimal: {
    icon: <Zap className="h-5 w-5" />,
    ring: 'ring-cyan-800/40',
    bg: 'bg-cyan-950/30',
    iconColor: 'text-cyan-400',
    titleColor: 'text-cyan-300',
    label: 'Optimal',
  },
  peak: {
    icon: <Flame className="h-5 w-5" />,
    ring: 'ring-orange-800/40',
    bg: 'bg-orange-950/30',
    iconColor: 'text-orange-400',
    titleColor: 'text-orange-300',
    label: 'Anaboler Peak',
  },
  warning: {
    icon: <Clock className="h-5 w-5" />,
    ring: 'ring-amber-800/40',
    bg: 'bg-amber-950/30',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-300',
    label: 'Timing-Konflikt',
  },
  antagonism: {
    icon: <AlertTriangle className="h-5 w-5" />,
    ring: 'ring-rose-800/40',
    bg: 'bg-rose-950/30',
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-300',
    label: 'Antagonismus',
  },
};

export default function BiohackingInsights({ insights }: BiohackingInsightsProps) {
  return (
    <div className="rounded-2xl bg-slate-800/60 p-5 ring-1 ring-slate-700/50 backdrop-blur-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-100">
        <Zap className="h-5 w-5 text-emerald-400" />
        Biohacking Insights
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Dynamische Synergie- & Antagonismus-Analyse aus deinen Mahlzeiten und Supplements.
      </p>

      {insights.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-slate-900/40 p-4 ring-1 ring-slate-700/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
            <Zap className="h-5 w-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">
            Logge Mahlzeiten und hak Supplements ab — hier erscheinen dann personalisierte Biohacking-Empfehlungen.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight) => {
            const config = TYPE_CONFIG[insight.type];
            return (
              <div
                key={insight.id}
                className={`flex items-start gap-3 rounded-xl p-3.5 ring-1 ${config.bg} ${config.ring} transition-all`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${config.iconColor}`}>
                  {config.icon}
                </div>
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className={`text-sm font-semibold ${config.titleColor}`}>
                      {insight.title}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.iconColor} bg-slate-900/40`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {insight.message}
                  </p>
                  {insight.details && (
                    <p className="mt-1 text-xs text-slate-600">
                      {insight.details}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
