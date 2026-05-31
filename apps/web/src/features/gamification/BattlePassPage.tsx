'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Lock, CheckCircle2, Zap, Gift, Star, Shield } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useGamificationStore } from '@/store/gamification.store';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const REWARD_ICONS: Record<string, React.ReactNode> = {
  gem:     <span className="text-neon-cyan text-lg">💎</span>,
  bolt:    <Zap size={20} className="text-neon-purple fill-neon-purple" />,
  gift:    <Gift size={20} className="text-neon-gold" />,
  shield:  <Shield size={20} className="text-neon-mint" />,
  star:    <Star size={20} className="text-neon-gold fill-neon-gold" />,
  crown:   <Crown size={20} className="text-neon-gold" />,
  trophy:  <span className="text-lg">🏆</span>,
  frame:   <span className="text-lg">🖼️</span>,
  pet:     <span className="text-lg">🐉</span>,
  palette: <span className="text-lg">🎨</span>,
};

function getRewardIcon(key: string) {
  return REWARD_ICONS[key] ?? <Gift size={20} className="text-text-muted" />;
}

export function BattlePassPage() {
  const qc = useQueryClient();
  const { awardXpLocal, awardCoinsLocal, setBpTier } = useGamificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['battle-pass'],
    queryFn: () => apiGet<any>('/gamification/battle-pass'),
  });

  const bpData = data as any;

  const claimMutation = useMutation({
    mutationFn: (tierId: string) => apiPost(`/gamification/battle-pass/claim/${tierId}`, {}),
    onSuccess: () => {
      toast.success('Recompensa resgatada! 🎉', { icon: '👑' });
      qc.invalidateQueries({ queryKey: ['battle-pass'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao resgatar'),
  });

  const unlockPremiumMutation = useMutation({
    mutationFn: () => apiPost('/gamification/battle-pass/unlock-premium', {}),
    onSuccess: () => {
      toast.success('Battle Pass Premium ativado! 👑');
      qc.invalidateQueries({ queryKey: ['battle-pass'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Moedas insuficientes'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-32 h-52 rounded-2xl flex-shrink-0" />)}
        </div>
      </div>
    );
  }

  if (!bpData) {
    return (
      <div className="card p-12 text-center">
        <Crown size={48} className="mx-auto text-neon-gold mb-4" />
        <p className="text-text-secondary font-semibold text-lg">Nenhuma temporada ativa</p>
        <p className="text-text-muted text-sm mt-2">Aguarde a próxima temporada do Battle Pass!</p>
      </div>
    );
  }

  const { season, userBattlePass, tiers } = bpData;
  const isPremium = userBattlePass?.hasPremium ?? false;
  const userTier = userBattlePass?.currentTier ?? 0;
  const totalTiers = Math.max(...(tiers ?? []).map((t: any) => t.tierNumber), 1);
  const progressPct = Math.min(100, (userTier / totalTiers) * 100);

  // Group tiers by number
  const tierMap: Record<number, { free?: any; premium?: any }> = {};
  (tiers ?? []).forEach((t: any) => {
    if (!tierMap[t.tierNumber]) tierMap[t.tierNumber] = {};
    if (t.track === 'FREE') tierMap[t.tierNumber].free = t;
    else tierMap[t.tierNumber].premium = t;
  });
  const tierNumbers = Object.keys(tierMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={22} className="text-neon-gold" />
            <h1 className="text-2xl font-display font-bold text-text-primary">Battle Pass</h1>
            {isPremium && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-neon-gold/20 text-neon-gold font-bold border border-neon-gold/30">
                PREMIUM
              </span>
            )}
          </div>
          <p className="text-text-dim text-sm">{season.name}</p>
          {season.endDate && (
            <p className="text-text-muted text-xs mt-0.5">
              Encerra em: {new Date(season.endDate).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {!isPremium && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => unlockPremiumMutation.mutate()}
            disabled={unlockPremiumMutation.isPending}
            className="btn btn-primary gap-2 py-2.5 shrink-0"
          >
            <Crown size={14} />
            Premium — 500 🪙
          </motion.button>
        )}
      </motion.div>

      {/* Season progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card p-5"
      >
        <div className="flex justify-between text-xs text-text-dim mb-2.5">
          <span className="font-semibold">Tier atual: <span className="text-neon-gold font-bold text-sm">{userTier}</span></span>
          <span>Tier máximo: {totalTiers}</span>
        </div>
        <div className="progress-bar h-4 relative">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7c5cff 0%, #ffd166 100%)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-muted">
          <span>Cada 100 XP = 1 Tier</span>
          <span>{progressPct.toFixed(0)}% completo</span>
        </div>
      </motion.div>

      {/* Tiers */}
      <div className="overflow-x-auto pb-3 no-scrollbar -mx-1 px-1">
        <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
          {tierNumbers.map((tierNum, i) => {
            const freeTier = tierMap[tierNum].free;
            const premiumTier = tierMap[tierNum].premium;
            const isUnlocked = userTier >= tierNum;

            return (
              <motion.div
                key={tierNum}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'flex-shrink-0 w-32 rounded-2xl border overflow-hidden',
                  isUnlocked
                    ? 'border-neon-gold/30 bg-gradient-to-b from-neon-gold/5 to-surface-2'
                    : 'border-border bg-surface-2/60',
                )}
              >
                {/* Tier header */}
                <div className={cn(
                  'px-3 py-2 text-center border-b',
                  isUnlocked ? 'bg-neon-gold/10 border-neon-gold/20' : 'bg-surface-3/60 border-border',
                )}>
                  <span className={cn(
                    'text-xs font-display font-bold',
                    isUnlocked ? 'text-neon-gold' : 'text-text-muted',
                  )}>
                    TIER {tierNum}
                  </span>
                </div>

                <div className="p-3 space-y-2">
                  {/* FREE row */}
                  {freeTier && (
                    <TierRewardRow
                      tier={freeTier}
                      isUnlocked={isUnlocked}
                      isPremium={isPremium}
                      onClaim={() => claimMutation.mutate(freeTier.id)}
                      isPending={claimMutation.isPending}
                    />
                  )}

                  {/* Divider */}
                  {freeTier && premiumTier && <div className="h-px bg-border" />}

                  {/* PREMIUM row */}
                  {premiumTier && (
                    <TierRewardRow
                      tier={premiumTier}
                      isUnlocked={isUnlocked}
                      isPremium={isPremium}
                      onClaim={() => claimMutation.mutate(premiumTier.id)}
                      isPending={claimMutation.isPending}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="card p-4 bg-neon-purple/5 border-neon-purple/20">
        <p className="text-xs text-text-dim leading-relaxed">
          <span className="text-neon-purple font-semibold">Como funciona:</span> Ganhe XP completando aulas, quizzes e missões diárias.
          Cada 100 XP sobe 1 tier. O Battle Pass Premium libera recompensas exclusivas em cada tier por apenas 500 moedas.
        </p>
      </div>
    </div>
  );
}

function TierRewardRow({
  tier, isUnlocked, isPremium, onClaim, isPending,
}: {
  tier: any;
  isUnlocked: boolean;
  isPremium: boolean;
  onClaim: () => void;
  isPending: boolean;
}) {
  const isPremiumTrack = tier.track === 'PREMIUM';
  const canAccess = !isPremiumTrack || isPremium;
  const canClaim = tier.canClaim && canAccess;

  return (
    <div className={cn(
      'flex flex-col items-center gap-1.5 py-2 rounded-xl',
      isPremiumTrack ? 'bg-neon-gold/5' : 'bg-surface-3/30',
    )}>
      <div className={cn(
        'text-[10px] font-bold px-2 py-0.5 rounded-full',
        isPremiumTrack ? 'bg-neon-gold/15 text-neon-gold' : 'bg-surface-4 text-text-muted',
      )}>
        {isPremiumTrack ? '👑 PRO' : '🆓 FREE'}
      </div>

      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center border',
        !canAccess && !isUnlocked
          ? 'bg-surface-3/50 border-border opacity-40'
          : isUnlocked
            ? isPremiumTrack
              ? 'bg-neon-gold/10 border-neon-gold/30'
              : 'bg-neon-purple/10 border-neon-purple/30'
            : 'bg-surface-3 border-border opacity-60',
      )}>
        {getRewardIcon(tier.rewardIconKey)}
      </div>

      {/* Name */}
      <span className="text-[11px] text-text-secondary font-medium text-center leading-tight px-1">
        {tier.rewardName}
      </span>

      {/* Action */}
      {canClaim ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClaim}
          disabled={isPending}
          className={cn(
            'w-full py-1.5 rounded-lg text-[11px] font-bold border transition-colors',
            isPremiumTrack
              ? 'bg-neon-gold/20 text-neon-gold border-neon-gold/30 hover:bg-neon-gold/30'
              : 'bg-neon-purple/20 text-neon-purple border-neon-purple/30 hover:bg-neon-purple/30',
          )}
        >
          Resgatar
        </motion.button>
      ) : tier.claimed ? (
        <CheckCircle2 size={16} className="text-neon-mint" />
      ) : !canAccess ? (
        <div className="flex items-center gap-1 text-[10px] text-neon-gold/60">
          <Lock size={10} />
          <span>Premium</span>
        </div>
      ) : (
        <Lock size={13} className="text-text-muted" />
      )}
    </div>
  );
}
