'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface StreakData {
  streak: number;
  longestStreak: number;
  days: { date: string; xpEarned: number }[];
}

function buildLast30Days(activeDates: Set<string>) {
  const result: { date: string; label: string; active: boolean; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      label: DAY_LABELS[d.getDay()],
      active: activeDates.has(dateStr),
      isToday: i === 0,
    });
  }
  return result;
}

interface Props {
  streak?: number;
  longestStreak?: number;
}

export function StreakCalendar({ streak: propStreak, longestStreak: propLongest }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['streak-history'],
    queryFn: () => apiGet<StreakData>('/gamification/streak'),
    staleTime: 60_000,
  });

  const streak = data?.streak ?? propStreak ?? 0;
  const longestStreak = data?.longestStreak ?? propLongest ?? 0;
  const activeDates = new Set((data?.days ?? []).map((d) => d.date));
  const last30 = buildLast30Days(activeDates);

  // Group into weeks (7 columns)
  const weeks: typeof last30[] = [];
  for (let i = 0; i < last30.length; i += 7) {
    weeks.push(last30.slice(i, i + 7));
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-surface-3" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-neon-orange/15 border border-neon-orange/25 flex items-center justify-center">
            <Flame size={16} className="text-neon-orange animate-[streak-fire_1s_ease-in-out_infinite]" />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-text-primary leading-none">{streak}</p>
            <p className="text-[11px] text-text-muted">dias seguidos</p>
          </div>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-neon-gold/15 border border-neon-gold/25 flex items-center justify-center">
            <Trophy size={14} className="text-neon-gold" />
          </div>
          <div>
            <p className="text-xl font-display font-bold text-text-primary leading-none">{longestStreak}</p>
            <p className="text-[11px] text-text-muted">recorde</p>
          </div>
        </div>
        {streak > 0 && (
          <>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-neon-mint font-semibold">
              <Zap size={12} className="fill-neon-mint" />
              Sequência ativa!
            </div>
          </>
        )}
      </div>

      {/* Calendar grid - last 28 days (4 weeks) */}
      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((l, i) => (
            <div key={i} className="text-center text-[10px] text-text-muted font-medium">{l}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {last30.slice(2).map((day, i) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015, duration: 0.2 }}
              title={`${day.date}${day.active ? ' — Estudou hoje!' : ''}`}
              className={cn(
                'aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all cursor-default',
                day.isToday
                  ? day.active
                    ? 'bg-neon-orange/30 border-2 border-neon-orange text-neon-orange shadow-[0_0_8px_rgba(255,122,24,0.4)]'
                    : 'bg-surface-3 border-2 border-neon-purple/40 text-neon-purple'
                  : day.active
                    ? 'bg-neon-orange/20 border border-neon-orange/40 text-neon-orange'
                    : 'bg-surface-3 border border-border text-text-muted opacity-40',
              )}
            >
              {day.active ? '🔥' : day.isToday ? '·' : ''}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Streak message */}
      {streak === 0 && (
        <p className="text-xs text-text-muted text-center">
          Complete uma aula hoje para iniciar sua sequência! 🎯
        </p>
      )}
      {streak >= 7 && (
        <p className="text-xs text-neon-mint text-center font-semibold">
          {streak >= 30 ? '🏆 Lenda! +30 dias de sequência!' : streak >= 14 ? '🔥 Incrível! 2 semanas seguidas!' : '⚡ 7 dias! Você é imparável!'}
        </p>
      )}
    </div>
  );
}
