'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGamificationStore } from '@/store/gamification.store';

export function XpBurstLayer() {
  const { pendingXpBursts, removeXpBurst } = useGamificationStore();

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {pendingXpBursts.map((burst) => (
          <XpBurst key={burst.id} burst={burst} onDone={() => removeXpBurst(burst.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function XpBurst({ burst, onDone }: { burst: { id: string; amount: number; x: number; y: number }; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1400);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ x: burst.x, y: burst.y, scale: 0.8, opacity: 1 }}
      animate={{ y: burst.y - 80, scale: 1.2, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="absolute font-display font-black text-neon-purple text-sm pointer-events-none select-none drop-shadow-[0_0_8px_rgba(124,92,255,0.8)]"
      style={{ left: 0, top: 0 }}
    >
      +{burst.amount} XP
    </motion.div>
  );
}
