'use client';

import { motion } from 'framer-motion';
import { cn, levelColor } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';
import { useAuthStore } from '@/store/auth.store';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  index: number;
}

const rankColors = ['text-neon-gold', 'text-zinc-300', 'text-amber-600'];
const rankBg = ['bg-neon-gold/10 border-neon-gold/20', 'bg-zinc-500/10 border-zinc-500/20', 'bg-amber-700/10 border-amber-700/20'];

export function LeaderboardRow({ entry, index }: LeaderboardRowProps) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isMe = entry.userId === currentUserId;
  const color = levelColor(entry.level);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
        isMe
          ? 'bg-neon-purple/10 border-neon-purple/30'
          : 'bg-surface-2 border-border hover:border-border/80',
        index < 3 && rankBg[index],
      )}
    >
      {/* Rank */}
      <div className={cn(
        'w-7 text-center font-display font-black text-sm',
        index < 3 ? rankColors[index] : 'text-text-dim',
      )}>
        {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${entry.rank}`}
      </div>

      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: entry.user.avatarColor + '30', border: `2px solid ${entry.user.avatarColor}50` }}
      >
        {entry.user.avatarUrl ? (
          <img src={entry.user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <span style={{ color: entry.user.avatarColor }}>
            {entry.user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-sm font-semibold truncate', isMe ? 'text-neon-purple' : 'text-text-primary')}>
            {entry.user.name}
            {isMe && <span className="ml-1 text-xs text-text-muted">(você)</span>}
          </span>
        </div>
        <div className="text-xs text-text-muted">@{entry.user.username}</div>
      </div>

      {/* Level badge */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
      >
        {entry.level}
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-text-primary tabular-nums">{entry.xp.toLocaleString()}</div>
        <div className="text-[10px] text-text-muted">XP</div>
      </div>
    </motion.div>
  );
}
