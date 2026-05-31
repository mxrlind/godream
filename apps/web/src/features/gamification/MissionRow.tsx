'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiPost } from '@/lib/api';
import { useGamificationStore } from '@/store/gamification.store';
import { cn } from '@/lib/utils';
import type { Mission } from '@/types';

interface MissionRowProps {
  mission: Mission;
}

export function MissionRow({ mission }: MissionRowProps) {
  const qc = useQueryClient();
  const { awardXpLocal, awardCoinsLocal } = useGamificationStore();

  const claimMutation = useMutation({
    mutationFn: () => apiPost(`/gamification/missions/${mission.id}/claim`, {}),
    onSuccess: () => {
      awardXpLocal(mission.xpReward);
      awardCoinsLocal(mission.coinReward);
      toast.success(`Missão concluída! +${mission.xpReward} XP +${mission.coinReward} moedas`, { icon: '🎯' });
      qc.invalidateQueries({ queryKey: ['missions'] });
    },
    onError: () => toast.error('Erro ao resgatar recompensa'),
  });

  const progressPct = Math.min(100, Math.round((mission.progress / mission.goalValue) * 100));

  return (
    <motion.div
      layout
      className={cn(
        'card p-4 flex items-center gap-4',
        mission.claimed && 'opacity-60',
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
        mission.completed ? 'bg-neon-mint/15 border border-neon-mint/30' : 'bg-surface-3 border border-border',
      )}>
        {mission.completed ? (
          <CheckCircle2 size={20} className="text-neon-mint" />
        ) : (
          <span className="text-lg">🎯</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-text-primary truncate">{mission.title}</span>
        </div>
        <p className="text-xs text-text-dim truncate">{mission.description}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 progress-bar h-1.5">
            <div
              className="progress-fill h-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-text-muted tabular-nums">
            {mission.progress}/{mission.goalValue}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs">
          <Zap size={11} className="text-neon-purple" />
          <span className="text-neon-purple font-bold">+{mission.xpReward}</span>
        </div>
        {mission.completed && !mission.claimed ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => claimMutation.mutate()}
            disabled={claimMutation.isPending}
            className="btn btn-primary btn-sm text-xs px-3 py-1"
          >
            Resgatar
          </motion.button>
        ) : mission.claimed ? (
          <span className="text-xs text-text-muted">Resgatado</span>
        ) : (
          <span className="text-xs text-text-muted">{progressPct}%</span>
        )}
      </div>
    </motion.div>
  );
}
