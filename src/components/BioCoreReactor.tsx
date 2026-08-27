import { Zap } from 'lucide-react';
import type { StreakData } from '@/lib/gamification';
import { getStreakLevel } from '@/lib/gamification';

interface BioCoreReactorProps {
  streak: StreakData;
}

export default function BioCoreReactor({ streak }: BioCoreReactorProps) {
  const level = getStreakLevel(streak.currentStreak);
  const days = streak.currentStreak;

  const isApex = days >= 8;
  const isOverdrive = days >= 4 && days < 8;
  const isAlpha = days >= 1 && days < 4;

  return (
    <div className={`rounded-2xl bg-slate-800/60 p-5 ring-1 ${level.ring} backdrop-blur-sm`}>
      <div className="flex items-center gap-4">
        {/* Animated core */}
        <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
          {/* Outer glow rings */}
          {isApex && (
            <>
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-1 animate-spin rounded-full border-2 border-amber-500/20 border-b-amber-300" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            </>
          )}
          {isOverdrive && (
            <>
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/10" />
              {/* Particles */}
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <div
                  key={deg}
                  className="absolute h-1 w-1 rounded-full bg-emerald-400"
                  style={{
                    transform: `rotate(${deg}deg) translateY(-32px)`,
                    animation: `particleFloat 2s ease-in-out infinite`,
                    animationDelay: `${deg / 300}s`,
                  }}
                />
              ))}
            </>
          )}
          {isAlpha && (
            <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/10" />
          )}

          {/* Core itself */}
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-full ${
              isApex
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/50'
                : isOverdrive
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50'
                  : isAlpha
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50'
                    : 'bg-slate-700 shadow-lg shadow-slate-700/30'
            }`}
            style={{
              animation: isApex
                ? 'corePulseApex 2s ease-in-out infinite'
                : isAlpha || isOverdrive
                  ? 'corePulse 2s ease-in-out infinite'
                  : 'none',
            }}
          >
            <Zap className={`h-7 w-7 ${isApex ? 'text-amber-900' : isOverdrive ? 'text-emerald-900' : isAlpha ? 'text-blue-900' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">Bio-Core Reaktor</h3>
            <span className={`text-xs font-semibold ${level.color}`}>
              {level.name}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${level.color}`}>
              {days}
            </span>
            <span className="text-xs text-slate-500">
              {days === 1 ? 'Tag' : 'Tage'} Streak
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {days === 0
              ? 'Erreiche alle Makro-Ziele, um den Core zu aktivieren.'
              : isAlpha
                ? 'Alpha Core aktiv — halte durch für Overdrive (Tag 4)!'
                : isOverdrive
                  ? 'Overdrive Core — Apex Matrix bei Tag 8 freigeschaltet!'
                  : 'Apex Matrix — maximaler Cyber-Reaktor erreicht!'}
          </p>
          {streak.bestStreak > 0 && (
            <p className="mt-0.5 text-[11px] text-slate-600">
              Bestleistung: {streak.bestStreak} Tage
            </p>
          )}
        </div>
      </div>

      {/* Progress to next level */}
      {days < 8 && days > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-slate-600">
            <span>{level.name}</span>
            <span>{days < 4 ? `Nächste Stufe: Tag 4` : `Nächste Stufe: Tag 8`}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAlpha ? 'bg-blue-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min((days / (days < 4 ? 4 : 8)) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
