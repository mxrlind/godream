'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { LeaderboardRow } from './LeaderboardRow';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

const PERIODS = [
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Geral', value: 'alltime' },
];

export function RankPage() {
  const [period, setPeriod] = useState('weekly');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => apiGet<any>(`/gamification/leaderboard?period=${period}&limit=50`),
  });

  const entries: LeaderboardEntry[] = (data as any)?.data ?? [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <Trophy size={24} className="text-neon-gold" />
            Ranking
          </h1>
          <p className="text-text-dim text-sm mt-1">Os melhores aprendizes da plataforma</p>
        </div>
        <div className="flex gap-1 bg-surface-3 rounded-xl p-1 border border-border">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                period === p.value
                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                  : 'text-text-dim hover:text-text-secondary',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-3">🏆</p>
          <p className="text-text-secondary font-semibold">Ainda sem dados para este período</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((entry, i) => (
            <LeaderboardRow key={entry.userId} entry={entry} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
