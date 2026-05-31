import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'cyan' | 'purple' | 'gold' | 'mint' | 'magenta';
  sublabel?: string;
  className?: string;
}

const colorMap = {
  cyan: 'text-neon-cyan border-neon-cyan/20 bg-neon-cyan/5',
  purple: 'text-neon-purple border-neon-purple/20 bg-neon-purple/5',
  gold: 'text-neon-gold border-neon-gold/20 bg-neon-gold/5',
  mint: 'text-neon-mint border-neon-mint/20 bg-neon-mint/5',
  magenta: 'text-neon-magenta border-neon-magenta/20 bg-neon-magenta/5',
};

export function StatTile({ label, value, icon, color = 'cyan', sublabel, className }: StatTileProps) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'card p-4 flex flex-col gap-3 border',
        colorMap[color],
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-current/10">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-display font-black text-text-primary">
          {value}
        </div>
        {sublabel && (
          <div className="text-xs text-text-muted mt-0.5">{sublabel}</div>
        )}
      </div>
    </motion.div>
  );
}
