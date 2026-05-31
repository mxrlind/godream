'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { MissionRow } from './MissionRow';
import { SkeletonRow } from '@/components/ui/Skeleton';
import type { Mission } from '@/types';

export function MissionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: () => apiGet<any>('/gamification/missions'),
  });

  const missions: Mission[] = (data as any)?.data ?? [];
  const active = missions.filter((m) => !m.claimed);
  const claimed = missions.filter((m) => m.claimed);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
          <Target size={24} className="text-neon-purple" />
          Missões
        </h1>
        <p className="text-text-dim text-sm mt-1">Complete missões para ganhar XP e moedas</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">Ativas</h2>
              <div className="space-y-2">
                {active.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <MissionRow mission={m} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {claimed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">Concluídas</h2>
              <div className="space-y-2">
                {claimed.map((m) => <MissionRow key={m.id} mission={m} />)}
              </div>
            </section>
          )}

          {missions.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-3">🎯</p>
              <p className="text-text-secondary font-semibold">Nenhuma missão disponível</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
