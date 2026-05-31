'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { rarityColor, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Badge } from '@/types';

const BADGE_ICONS: Record<string, string> = {
  first_lesson: '📖',
  streak_7: '🔥',
  streak_30: '🔥',
  quiz_master: '🧠',
  speed_learner: '⚡',
  social_butterfly: '🦋',
  completionist: '✅',
  top_student: '🏆',
  night_owl: '🦉',
  early_bird: '🌅',
  shopaholic: '🛍️',
  collector: '💎',
  course_creator: '🎓',
  legend: '👑',
  default: '⭐',
};

interface BadgeData extends Badge {
  unlockedAt?: string;
  isUnlocked?: boolean;
}

export function BadgesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: () => apiGet<any>('/gamification/badges'),
  });

  const badges: BadgeData[] = (data as any)?.data ?? [];
  const unlocked = badges.filter((b) => b.isUnlocked);
  const locked = badges.filter((b) => !b.isUnlocked && !b.isSecret);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
          <Award size={24} className="text-neon-gold" />
          Conquistas
        </h1>
        <p className="text-text-dim text-sm mt-1">
          {unlocked.length} de {badges.filter((b) => !b.isSecret).length} desbloqueadas
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {unlocked.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Desbloqueadas ({unlocked.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {unlocked.map((badge, i) => (
                  <BadgeCard key={badge.id} badge={badge} unlocked index={i} />
                ))}
              </div>
            </section>
          )}

          {locked.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Bloqueadas ({locked.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {locked.map((badge, i) => (
                  <BadgeCard key={badge.id} badge={badge} unlocked={false} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BadgeCard({ badge, unlocked, index }: { badge: BadgeData; unlocked: boolean; index: number }) {
  const color = rarityColor(badge.rarity);
  const icon = BADGE_ICONS[badge.iconKey] || BADGE_ICONS.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileHover={unlocked ? { y: -4, scale: 1.02 } : {}}
      className={cn(
        'card p-4 flex flex-col items-center gap-2 text-center transition-all',
        !unlocked && 'opacity-40 grayscale',
      )}
      style={unlocked ? { borderColor: `${color}30` } : {}}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{
          background: unlocked ? `${color}15` : 'rgba(255,255,255,0.04)',
          border: `2px solid ${unlocked ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
          boxShadow: unlocked ? `0 0 20px ${color}20` : 'none',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          className="text-xs font-bold leading-tight"
          style={{ color: unlocked ? color : 'var(--text-muted)' }}
        >
          {badge.name}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">{badge.description}</p>
      </div>
      <div
        className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full"
        style={{
          background: unlocked ? `${color}15` : 'rgba(255,255,255,0.04)',
          color: unlocked ? color : 'var(--text-muted)',
        }}
      >
        {badge.rarity}
      </div>
    </motion.div>
  );
}
