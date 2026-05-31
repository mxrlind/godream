'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, DollarSign, TrendingUp, Star, BookOpen,
  ArrowLeft, CheckCircle2, Award, Lightbulb, AlertTriangle,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: '7 dias',  value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
] as const;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-text-muted mb-0.5">{label}</p>
      <p className="font-bold text-neon-cyan">
        {payload[0].value} {payload[0].name}
      </p>
    </div>
  );
}

// ─── KPI Tile ─────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  cyan:   '#00e5ff',
  mint:   '#39ff14',
  gold:   '#ffd166',
  purple: '#7c5cff',
};

function KpiTile({
  label, value, sublabel, icon, color,
}: {
  label: string; value: string; sublabel?: string; icon: React.ReactNode; color: string;
}) {
  const hex = COLOR_MAP[color] ?? color;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${hex}18`, color: hex }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-display font-black text-text-primary">{value}</p>
        {sublabel && <p className="text-xs text-text-muted mt-0.5">{sublabel}</p>}
      </div>
    </motion.div>
  );
}

// ─── Insight card ─────────────────────────────────────────────────────────────
function InsightCard({ type, text }: { type: 'positive' | 'warning' | 'info'; text: string }) {
  const styles = {
    positive: { bg: 'bg-neon-mint/10 border-neon-mint/20', text: 'text-neon-mint', Icon: CheckCircle2 },
    warning:  { bg: 'bg-neon-gold/10 border-neon-gold/20', text: 'text-neon-gold', Icon: AlertTriangle },
    info:     { bg: 'bg-neon-cyan/10 border-neon-cyan/20', text: 'text-neon-cyan',  Icon: Lightbulb },
  }[type];

  return (
    <div className={cn('flex items-start gap-2.5 p-3 rounded-xl border', styles.bg)}>
      <styles.Icon size={13} className={cn('flex-shrink-0 mt-0.5', styles.text)} />
      <p className="text-xs text-text-secondary leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CourseAnalyticsPage({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'course', courseId, days],
    queryFn: () => apiGet<any>(`/analytics/creator/courses/${courseId}?days=${days}`),
  });

  const d = (data as any)?.data ?? data;

  // ─── Loading skeleton ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="page-container space-y-5">
        <div className="h-10 w-56 bg-surface-2 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
        <div className="card h-56 animate-pulse" />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card h-64 animate-pulse" />
          <div className="card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!d) return null;

  const {
    course, revenue, completionRate, avgProgress,
    enrollmentChart, lessons, reviewDistribution,
  } = d;

  const chartData: { date: string; count: number }[] = enrollmentChart ?? [];

  // ─── Rating distribution ───────────────────────────────────
  const starData = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewDistribution?.[star] ?? 0,
  }));
  const maxStarCount = Math.max(...starData.map((s) => s.count), 1);

  // ─── Auto-generated insights ───────────────────────────────
  const insights: { type: 'positive' | 'warning' | 'info'; text: string }[] = [];

  if (completionRate >= 70) {
    insights.push({ type: 'positive', text: `Taxa de conclusão de ${completionRate.toFixed(0)}% — excelente! Seus alunos estão engajados.` });
  } else if (completionRate < 30 && course.enrolledCount > 5) {
    insights.push({ type: 'warning', text: `Apenas ${completionRate.toFixed(0)}% dos alunos concluem o curso. Considere aulas mais curtas ou conteúdo mais dinâmico.` });
  }

  if (course.avgRating >= 4.5 && course.ratingCount > 0) {
    insights.push({ type: 'positive', text: `Avaliação ${course.avgRating.toFixed(1)}★ — seu curso está entre os melhores avaliados!` });
  } else if (course.ratingCount === 0) {
    insights.push({ type: 'info', text: 'Nenhuma avaliação ainda. Incentive seus alunos a deixar um feedback.' });
  }

  const topLesson = [...(lessons ?? [])].sort((a: any, b: any) => b.completionRate - a.completionRate)[0];
  const bottomLesson = [...(lessons ?? [])].sort((a: any, b: any) => a.completionRate - b.completionRate)[0];

  if (topLesson && bottomLesson && topLesson.id !== bottomLesson.id) {
    if (bottomLesson.completionRate < 20) {
      insights.push({ type: 'warning', text: `A aula "${bottomLesson.title}" tem apenas ${bottomLesson.completionRate.toFixed(0)}% de conclusão. Revisar o conteúdo pode ajudar.` });
    }
  }

  if (course.enrolledCount === 0) {
    insights.push({ type: 'info', text: 'Nenhum aluno matriculado ainda. Divulgue seu curso nas redes sociais e comunidades.' });
  } else if (chartData.length > 0) {
    const recent = chartData.slice(-7).reduce((s: number, c: any) => s + c.count, 0);
    if (recent === 0) {
      insights.push({ type: 'warning', text: 'Nenhuma nova matrícula nos últimos 7 dias. Considere uma promoção ou novo conteúdo.' });
    }
  }

  return (
    <div className="page-container space-y-5">
      {/* ═══ Header ═══════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 flex-wrap">
        <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg flex-shrink-0"
          style={{ background: `${course.accentColor}20`, border: `2px solid ${course.accentColor}35`, color: course.accentColor }}
        >
          {course.abbr}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-text-primary leading-tight truncate">
            {course.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
            <span className="flex items-center gap-1">
              <Star size={11} className="text-neon-gold fill-neon-gold" />
              {course.avgRating?.toFixed(1) ?? '–'} ({course.ratingCount} avaliações)
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} />
              {course.enrolledCount} alunos
            </span>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                days === opt.value
                  ? 'bg-surface-1 text-text-primary shadow-sm'
                  : 'text-text-dim hover:text-text-secondary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ KPI Tiles ════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          label="Total de alunos"
          value={course.enrolledCount?.toLocaleString('pt-BR') ?? '0'}
          icon={<Users size={16} />}
          color="cyan"
        />
        <KpiTile
          label="Receita (creator)"
          value={`R$ ${Number(revenue.creatorEarning ?? 0).toFixed(0)}`}
          sublabel={`${revenue.sales} venda${revenue.sales !== 1 ? 's' : ''}`}
          icon={<DollarSign size={16} />}
          color="mint"
        />
        <KpiTile
          label="Taxa de conclusão"
          value={`${completionRate?.toFixed(1)}%`}
          sublabel={`Progresso médio: ${avgProgress?.toFixed(0)}%`}
          icon={<CheckCircle2 size={16} />}
          color="gold"
        />
        <KpiTile
          label="Avaliação média"
          value={`${course.avgRating?.toFixed(2) ?? '–'} ★`}
          sublabel={`${course.ratingCount} avaliações`}
          icon={<Award size={16} />}
          color="purple"
        />
      </div>

      {/* ═══ Enrollment chart ════════════════════════════════ */}
      {chartData.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-neon-cyan" />
            <h2 className="text-sm font-semibold text-text-primary">
              Novas matrículas — últimos {days} dias
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={(d: string) => d.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="matrículas"
                stroke="#00e5ff"
                strokeWidth={2}
                fill="url(#enrollGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#00e5ff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 flex flex-col items-center gap-2 text-center"
        >
          <TrendingUp size={28} className="text-text-muted opacity-40" />
          <p className="text-sm text-text-secondary">Nenhuma matrícula nos últimos {days} dias</p>
          <p className="text-xs text-text-muted">Divulgue o curso para atrair novos alunos</p>
        </motion.div>
      )}

      {/* ═══ Lessons + Ratings ═══════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Lesson completion */}
        {(lessons?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={14} className="text-neon-purple" />
              <h2 className="text-sm font-semibold text-text-primary">Taxa de conclusão por aula</h2>
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {lessons.slice(0, 20).map((lesson: any, i: number) => (
                <div key={lesson.id} className="flex items-center gap-3">
                  <span className="text-xs text-text-muted w-5 text-right flex-shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary truncate">{lesson.title}</p>
                    <div className="mt-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, lesson.completionRate)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.03 }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            lesson.completionRate >= 70 ? '#39ff14'
                            : lesson.completionRate >= 40 ? '#7c5cff'
                            : '#ff3df0',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-text-primary w-10 text-right flex-shrink-0 tabular-nums">
                    {lesson.completionRate?.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Ratings distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-neon-gold" />
            <h2 className="text-sm font-semibold text-text-primary">Distribuição de avaliações</h2>
          </div>

          {course.ratingCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-text-muted gap-2">
              <Star size={28} className="opacity-25" />
              <p className="text-sm">Nenhuma avaliação ainda</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {starData.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 w-16 flex-shrink-0">
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} size={10} className="text-neon-gold fill-neon-gold" />
                    ))}
                  </div>
                  <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxStarCount) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-neon-gold"
                    />
                  </div>
                  <span className="text-xs text-text-muted w-6 text-right flex-shrink-0 tabular-nums">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-display font-black text-neon-gold">
                {course.avgRating?.toFixed(1) ?? '–'}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Média</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-display font-black text-text-primary">
                {course.ratingCount}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Avaliações</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-display font-black text-neon-mint">
                {completionRate?.toFixed(0)}%
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Conclusão</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ Insights ════════════════════════════════════════ */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-neon-gold" />
            <h2 className="text-sm font-semibold text-text-primary">Insights automáticos</h2>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <InsightCard key={i} type={insight.type} text={insight.text} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
