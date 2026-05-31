'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Flame, Zap, TrendingUp, BookOpen, Target, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useGamificationStore } from '@/store/gamification.store';
import { apiGet } from '@/lib/api';
import { CourseCard } from '@/features/courses/CourseCard';
import { MissionRow } from '@/features/gamification/MissionRow';
import { LeaderboardRow } from '@/features/gamification/LeaderboardRow';
import { StreakCalendar } from '@/features/gamification/StreakCalendar';
import { LevelOrb } from '@/features/gamification/LevelOrb';
import { StatTile } from '@/components/ui/StatTile';
import { Skeleton } from '@/components/ui/Skeleton';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const g = useGamificationStore();

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses', 'recent'],
    queryFn: () => apiGet<any>('/courses?limit=3'),
  });

  const { data: missions, isLoading: loadingMissions } = useQuery({
    queryKey: ['missions'],
    queryFn: () => apiGet<any>('/gamification/missions'),
  });

  const { data: leaderboard, isLoading: loadingLb } = useQuery({
    queryKey: ['leaderboard', 'weekly'],
    queryFn: () => apiGet<any[]>('/gamification/leaderboard?period=weekly&limit=5'),
  });

  const xpNeeded = Math.floor(100 * Math.pow(g.level, 1.6));
  const xpPct = Math.min(100, Math.round((g.xp / xpNeeded) * 100));

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">
            Olá, <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-text-dim mt-1">
            Pronto para evoluir hoje? Você está a poucos passos do próximo nível.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary"
          onClick={() => window.location.href = '/courses'}
        >
          Continuar estudando
        </motion.button>
      </motion.div>

      {/* ─── Hero Level Card ────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-surface-2 to-surface-3 border border-border"
        style={{ background: 'linear-gradient(135deg, rgba(124,92,255,0.12) 0%, rgba(0,229,255,0.06) 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-neon-purple/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-neon-cyan/08 blur-3xl translate-y-1/2" />

        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-neon-purple/15 border border-neon-purple/25 rounded-full px-3 py-1 text-xs font-bold text-neon-purple mb-4">
              <Zap size={11} className="fill-neon-purple" />
              TEMPORADA 1 · GENESIS
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Você está no <span className="text-gradient">Level {g.level}</span>
            </h2>
            <p className="text-text-dim text-sm max-w-md">
              Complete missões diárias para desbloquear recompensas exclusivas no Battle Pass desta temporada.
            </p>
            {/* XP Bar */}
            <div className="mt-5 max-w-sm">
              <div className="flex justify-between text-xs text-text-dim mb-2">
                <span>{g.xp.toLocaleString('pt-BR')} XP</span>
                <span>{xpNeeded.toLocaleString('pt-BR')} XP</span>
              </div>
              <div className="progress-bar h-3">
                <motion.div
                  className="progress-fill h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1">{xpPct}% para o próximo nível</p>
            </div>
          </div>
          <LevelOrb level={g.level} xp={g.xp} size="lg" />
        </div>
      </motion.div>

      {/* ─── Stats Grid ──────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile icon={<Flame size={18} className="text-neon-orange" />} label="Streak" value={`${g.streak}d`} sublabel="dias seguidos" color="mint" />
        <StatTile icon={<Zap size={18} className="text-neon-purple" />} label="XP Total" value={g.totalXp.toLocaleString('pt-BR')} sublabel="acumulado" color="purple" />
        <StatTile icon={<span className="text-neon-gold text-base font-bold">🪙</span>} label="Moedas" value={g.coins.toLocaleString('pt-BR')} sublabel="saldo" color="gold" />
        <StatTile icon={<TrendingUp size={18} className="text-neon-cyan" />} label="Ranking" value={`#${g.rank}`} sublabel="global" color="cyan" />
      </motion.div>

      {/* ─── Main Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left */}
        <div className="space-y-6">
          {/* Continue Studying */}
          <motion.div variants={fadeUp} className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold flex items-center gap-2">
                <BookOpen size={18} className="text-neon-cyan" />
                Continue de onde parou
              </h3>
              <a href="/courses" className="text-xs text-text-dim hover:text-neon-cyan transition-colors">
                Ver todos →
              </a>
            </div>
            {loadingCourses ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(courses?.data || []).slice(0, 3).map((c: any) => (
                  <CourseCard key={c.id} course={c} compact />
                ))}
              </div>
            )}
          </motion.div>

          {/* Streak Calendar */}
          <motion.div variants={fadeUp} className="card">
            <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-5">
              <Flame size={18} className="text-orange-400" />
              Sua semana
            </h3>
            <StreakCalendar streak={g.streak} />
          </motion.div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Daily Missions */}
          <motion.div variants={fadeUp} className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold flex items-center gap-2">
                <Target size={18} className="text-neon-mint" />
                Missões diárias
              </h3>
              <a href="/missions" className="text-xs text-text-dim hover:text-neon-mint transition-colors">
                Ver todas →
              </a>
            </div>
            {loadingMissions ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {((missions as any)?.data || missions || []).slice(0, 4).map((m: any) => (
                  <MissionRow key={m.id} mission={m} />
                ))}
              </div>
            )}
          </motion.div>

          {/* Top Ranking */}
          <motion.div variants={fadeUp} className="card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-display font-bold flex items-center gap-2">
                <Trophy size={18} className="text-neon-gold" />
                Top ranking
              </h3>
              <a href="/rank" className="text-xs text-text-dim hover:text-neon-gold transition-colors">
                Ver mais →
              </a>
            </div>
            {loadingLb ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-1">
                {((leaderboard as any)?.data || leaderboard || []).slice(0, 5).map((entry: any, i: number) => (
                  <LeaderboardRow key={entry.userId} entry={entry} index={i} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
