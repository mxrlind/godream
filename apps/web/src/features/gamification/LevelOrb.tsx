'use client';

import { motion } from 'framer-motion';
import { levelColor, levelProgress } from '@/lib/utils';

interface LevelOrbProps {
  level: number;
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const sizes = {
  sm: { orb: 40, text: 'text-sm', ring: 36 },
  md: { orb: 56, text: 'text-base', ring: 50 },
  lg: { orb: 72, text: 'text-xl', ring: 64 },
};

export function LevelOrb({ level, xp, size = 'md', showProgress = true }: LevelOrbProps) {
  const color = levelColor(level);
  const progress = levelProgress(xp, level);
  const { orb, text, ring } = sizes[size];
  const circumference = Math.PI * ring;
  const strokeDash = (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: orb, height: orb }}>
      {showProgress && (
        <svg
          className="absolute inset-0 -rotate-90"
          width={orb}
          height={orb}
          viewBox={`0 0 ${orb} ${orb}`}
        >
          <circle
            cx={orb / 2}
            cy={orb / 2}
            r={ring / 2}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          <motion.circle
            cx={orb / 2}
            cy={orb / 2}
            r={ring / 2}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
      )}
      <div
        className={`rounded-full flex items-center justify-center font-display font-black ${text}`}
        style={{
          width: orb - 8,
          height: orb - 8,
          background: `radial-gradient(circle at 35% 35%, ${color}30, ${color}10)`,
          border: `2px solid ${color}40`,
          color,
          boxShadow: `0 0 16px ${color}30`,
        }}
      >
        {level}
      </div>
    </div>
  );
}
