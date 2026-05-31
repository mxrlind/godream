'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, TrendingUp, Users, DollarSign, Plus, Edit2,
  Eye, BarChart2, Zap, Globe, Clock, CheckCircle2,
  MoreVertical, Trash2, X, AlertTriangle, ArrowUpRight,
  Star, Layers, ChevronRight, Filter,
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
type CourseStatus = 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW' | 'ARCHIVED' | 'REJECTED';
type FilterTab = 'all' | 'PUBLISHED' | 'DRAFT' | 'PENDING_REVIEW';

const STATUS_META: Record<CourseStatus, { label: string; color: string; bg: string }> = {
  PUBLISHED:      { label: 'Publicado',   color: '#39ff14', bg: 'rgba(57,255,20,0.12)'   },
  DRAFT:          { label: 'Rascunho',    color: '#7c5cff', bg: 'rgba(124,92,255,0.12)'  },
  PENDING_REVIEW: { label: 'Em revisão',  color: '#ffd166', bg: 'rgba(255,209,102,0.12)' },
  ARCHIVED:       { label: 'Arquivado',   color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  REJECTED:       { label: 'Rejeitado',   color: '#ff3df0', bg: 'rgba(255,61,240,0.12)'  },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function CreatorDashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState<any | null>(null);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['creator', 'analytics'],
    queryFn: () => apiGet<any>('/analytics/creator'),
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['creator', 'courses'],
    queryFn: () => apiGet<any>('/courses/creator/my-courses'),
  });

  const analytics = (analyticsData as any)?.data?.summary ?? {};
  const enrollmentChart = (analyticsData as any)?.data?.enrollmentChart ?? [];
  const allCourses: any[] = (coursesData as any)?.data ?? [];
  const courses = filter === 'all'
    ? allCourses
    : allCourses.filter((c) => c.status === filter);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all',           label: 'Todos',       count: allCourses.length },
    { key: 'PUBLISHED',     label: 'Publicados',  count: allCourses.filter((c) => c.status === 'PUBLISHED').length },
    { key: 'DRAFT',         label: 'Rascunhos',   count: allCourses.filter((c) => c.status === 'DRAFT').length },
    { key: 'PENDING_REVIEW',label: 'Em revisão',  count: allCourses.filter((c) => c.status === 'PENDING_REVIEW').length },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2.5">
            <Zap size={22} className="text-neon-purple" />
            Creator Studio
          </h1>
          <p className="text-text-dim text-sm mt-0.5">Gerencie seus cursos e acompanhe seu impacto</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowNewCourse(true)}
          className="btn btn-primary gap-2"
        >
          <Plus size={15} />
          Novo curso
        </motion.button>
      </motion.div>

      {/* ─── KPI Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {analyticsLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : (
            <>
              <KpiCard label="Alunos Totais"   value={analytics.totalStudents ?? 0}    icon={<Users size={16} />}        color="cyan"   trend={+12} />
              <KpiCard label="Receita (R$)"    value={`${(analytics.totalRevenue ?? 0).toFixed(0)}`} icon={<DollarSign size={16} />}   color="mint"   prefix="R$" />
              <KpiCard label="Avaliação Média" value={`${(analytics.avgRating ?? 0).toFixed(1)}`}    icon={<Star size={16} />}         color="gold"   suffix="★" />
              <KpiCard label="Cursos Ativos"   value={allCourses.filter((c) => c.status === 'PUBLISHED').length} icon={<BookOpen size={16} />} color="purple" />
            </>
          )}
      </div>

      {/* ─── Enrollment Chart ──────────────────────────────── */}
      {enrollmentChart.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-neon-cyan" />
              <span className="text-sm font-semibold text-text-primary">Novas Matrículas — Últimos 30 dias</span>
            </div>
            <span className="text-xs text-text-muted">
              Total: <strong className="text-neon-cyan">{enrollmentChart.reduce((s: number, d: any) => s + (d.count ?? 0), 0)}</strong>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={enrollmentChart} margin={{ top: 2, right: 2, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="cgrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }}
                tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
                      <p className="text-text-muted">{label}</p>
                      <p className="font-bold text-neon-cyan">{payload[0].value} matrículas</p>
                    </div>
                  ) : null}
              />
              <Area type="monotone" dataKey="count" stroke="#00e5ff" strokeWidth={2}
                fill="url(#cgrd)" dot={false} activeDot={{ r: 3, fill: '#00e5ff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ─── Courses Section ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-display font-bold text-text-primary flex items-center gap-2">
            <Layers size={16} className="text-text-muted" />
            Meus Cursos
          </h2>
          {/* Filter tabs */}
          <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                  filter === tab.key
                    ? 'bg-surface-1 text-text-primary shadow-sm'
                    : 'text-text-dim hover:text-text-secondary',
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    filter === tab.key ? 'bg-neon-purple/20 text-neon-purple' : 'bg-surface-3 text-text-muted',
                  )}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {coursesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState filter={filter} onNew={() => setShowNewCourse(true)} />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {courses.map((course: any, i: number) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={i}
                  onEdit={() => router.push(`/creator/courses/${course.id}/edit`)}
                  onAnalytics={() => router.push(`/creator/courses/${course.id}/analytics`)}
                  onPreview={() => router.push(`/courses/${course.slug}`)}
                  onDelete={() => setDeletingCourse(course)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Modals ────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewCourse && (
          <NewCourseModal
            onClose={() => setShowNewCourse(false)}
            onCreated={(courseId) => {
              setShowNewCourse(false);
              qc.invalidateQueries({ queryKey: ['creator', 'courses'] });
              router.push(`/creator/courses/${courseId}/edit`);
            }}
          />
        )}
        {deletingCourse && (
          <DeleteCourseModal
            course={deletingCourse}
            onClose={() => setDeletingCourse(null)}
            onDeleted={() => {
              setDeletingCourse(null);
              qc.invalidateQueries({ queryKey: ['creator', 'courses'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, trend, prefix, suffix }: {
  label: string; value: string | number; icon: React.ReactNode;
  color: 'cyan' | 'mint' | 'gold' | 'purple';
  trend?: number; prefix?: string; suffix?: string;
}) {
  const colors = {
    cyan:   { text: 'text-neon-cyan',   bg: 'bg-neon-cyan/10',   border: 'border-neon-cyan/20'   },
    mint:   { text: 'text-neon-mint',   bg: 'bg-neon-mint/10',   border: 'border-neon-mint/20'   },
    gold:   { text: 'text-neon-gold',   bg: 'bg-neon-gold/10',   border: 'border-neon-gold/20'   },
    purple: { text: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/20' },
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn('card p-4 border', colors.border)}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', colors.bg, colors.text)}>
        {icon}
      </div>
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className={cn('text-2xl font-display font-black', colors.text)}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}{suffix}
      </p>
      {trend !== undefined && (
        <p className="text-[10px] text-neon-mint mt-1 flex items-center gap-0.5">
          <ArrowUpRight size={10} /> +{trend}% este mês
        </p>
      )}
    </motion.div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, index, onEdit, onAnalytics, onPreview, onDelete }: {
  course: any; index: number;
  onEdit: () => void; onAnalytics: () => void;
  onPreview: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusMeta = STATUS_META[course.status as CourseStatus] ?? STATUS_META.DRAFT;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.04 }}
      className="card p-4 flex items-center gap-4 hover:border-border/80 transition-all group"
    >
      {/* Thumbnail */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center font-display font-black text-xl flex-shrink-0 border"
        style={{
          background: `${course.accentColor}18`,
          borderColor: `${course.accentColor}35`,
          color: course.accentColor,
        }}
      >
        {course.abbr}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-sm text-text-primary truncate">{course.title}</h3>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
            style={{ background: statusMeta.bg, color: statusMeta.color }}
          >
            {statusMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {course.enrolledCount ?? 0} alunos
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={11} />
            {course.totalLessons ?? 0} aulas
          </span>
          {course.avgRating > 0 && (
            <span className="flex items-center gap-1">
              <Star size={11} className="text-neon-gold fill-neon-gold" />
              {course.avgRating?.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <DollarSign size={11} />
            {course.isFree ? 'Grátis' : `R$ ${Number(course.price ?? 0).toFixed(0)}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <ActionBtn onClick={onEdit} icon={<Edit2 size={13} />} label="Editar" />
        <ActionBtn onClick={onAnalytics} icon={<BarChart2 size={13} />} label="Analytics" />
        <ActionBtn onClick={onPreview} icon={<Eye size={13} />} label="Preview" />

        {/* More menu */}
        <div className="relative">
          <ActionBtn
            onClick={() => setMenuOpen(!menuOpen)}
            icon={<MoreVertical size={13} />}
            label="Mais"
          />
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  className="absolute right-0 top-8 z-20 bg-surface-2 border border-border rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                >
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={12} />
                    Excluir curso
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Always visible edit chevron */}
      <button
        onClick={onEdit}
        className="flex-shrink-0 text-text-muted group-hover:text-neon-cyan transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </motion.div>
  );
}

function ActionBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-3 border border-border text-text-dim hover:text-text-primary hover:border-border/80 transition-all"
    >
      {icon}
    </motion.button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ filter, onNew }: { filter: FilterTab; onNew: () => void }) {
  const msgs: Record<FilterTab, { title: string; sub: string }> = {
    all:           { title: 'Nenhum curso ainda',      sub: 'Crie seu primeiro curso para começar a monetizar' },
    PUBLISHED:     { title: 'Sem cursos publicados',   sub: 'Publique um curso para ele aparecer aqui' },
    DRAFT:         { title: 'Sem rascunhos',           sub: 'Todos seus cursos estão publicados!' },
    PENDING_REVIEW:{ title: 'Nada em revisão',         sub: 'Nenhum curso aguardando aprovação' },
  };
  const { title, sub } = msgs[filter];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="card p-12 text-center space-y-3">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto">
        <BookOpen size={28} className="text-text-muted" />
      </div>
      <p className="font-semibold text-text-secondary">{title}</p>
      <p className="text-text-dim text-sm">{sub}</p>
      {filter === 'all' && (
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onNew}
          className="btn btn-primary mx-auto gap-2 mt-2"
        >
          <Plus size={14} />
          Criar primeiro curso
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── New Course Modal ─────────────────────────────────────────────────────────
const PRESET_COLORS = ['#7c5cff','#00e5ff','#ff3df0','#f7df1e','#39ff14','#ff7a18','#3776ab','#e34f26','#f05032','#06b6d4'];

function NewCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    title: '', description: '', abbr: '', accentColor: '#7c5cff',
    isFree: true, price: '', level: 'BEGINNER', categoryId: '',
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<any>('/courses/categories'),
  });
  const categories: any[] = (catData as any)?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {
        title: form.title.trim(),
        description: form.description.trim(),
        abbr: form.abbr.trim().toUpperCase().slice(0, 4),
        accentColor: form.accentColor,
        level: form.level,
        isFree: form.isFree,
      };
      if (form.categoryId) payload.categoryId = form.categoryId;
      if (!form.isFree && form.price) payload.price = parseFloat(form.price);
      return apiPost<any>('/courses', payload);
    },
    onSuccess: (res: any) => {
      const course = res?.data ?? res;
      toast.success('Curso criado! Agora adicione módulos e aulas.');
      onCreated(course.id);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg ?? 'Erro ao criar curso');
    },
  });

  const canProceed = form.title.trim().length >= 5 && form.description.trim().length >= 10 && form.abbr.trim().length >= 1;
  const canCreate = canProceed;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-2xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-display font-bold text-lg text-text-primary">Criar novo curso</h3>
            <p className="text-xs text-text-muted mt-0.5">Passo {step} de 2</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-0 divide-x divide-border">
          {/* Form */}
          <div className="flex-1 p-5 space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="label">Título do curso <span className="text-red-400">*</span></label>
                  <input
                    autoFocus
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input w-full"
                    placeholder="Ex: JavaScript do Zero ao Avançado"
                    maxLength={120}
                  />
                  <p className="text-[10px] text-text-muted mt-1">{form.title.length}/120 — mín. 5 caracteres</p>
                </div>

                <div>
                  <label className="label">Descrição <span className="text-red-400">*</span></label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input w-full resize-none"
                    rows={3}
                    placeholder="O que o aluno vai aprender? Seja específico."
                    maxLength={500}
                  />
                  {form.description.trim().length > 0 && form.description.trim().length < 10 && (
                    <p className="text-[11px] text-amber-400 mt-1">Faltam {10 - form.description.trim().length} caracteres</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Sigla (1–4 chars) <span className="text-red-400">*</span></label>
                    <input
                      value={form.abbr}
                      onChange={(e) => setForm({ ...form, abbr: e.target.value.toUpperCase().slice(0, 4) })}
                      className="input w-full font-mono text-center text-lg font-bold"
                      placeholder="JS"
                    />
                  </div>
                  <div>
                    <label className="label">Nível</label>
                    <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="input w-full">
                      <option value="BEGINNER">Iniciante</option>
                      <option value="INTERMEDIATE">Intermediário</option>
                      <option value="ADVANCED">Avançado</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Cor de destaque</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, accentColor: c })}
                        className="w-7 h-7 rounded-lg border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: form.accentColor === c ? 'white' : 'transparent',
                          boxShadow: form.accentColor === c ? `0 0 8px ${c}` : 'none',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-border bg-surface-2 p-0.5"
                      title="Cor personalizada"
                    />
                  </div>
                </div>

                {categories.length > 0 && (
                  <div>
                    <label className="label">Categoria</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {categories.map((cat: any) => (
                        <button
                          key={cat.id}
                          onClick={() => setForm({ ...form, categoryId: form.categoryId === cat.id ? '' : cat.id })}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                            form.categoryId === cat.id
                              ? 'text-white border-transparent'
                              : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
                          )}
                          style={form.categoryId === cat.id ? { background: cat.color, borderColor: cat.color } : {}}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Acesso</label>
                  <div className="flex gap-2 mt-1">
                    {[
                      { value: true,  label: 'Gratuito', color: 'neon-mint' },
                      { value: false, label: 'Pago',     color: 'neon-gold' },
                    ].map(({ value, label, color }) => (
                      <button
                        key={String(value)}
                        onClick={() => setForm({ ...form, isFree: value })}
                        className={cn(
                          'flex-1 py-2 rounded-xl text-sm font-semibold border transition-all',
                          form.isFree === value
                            ? `bg-${color}/15 border-${color}/40 text-${color}`
                            : 'bg-surface-3 border-border text-text-dim',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {!form.isFree && (
                    <div className="mt-2">
                      <label className="label">Preço (R$)</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="input w-full"
                        placeholder="97.00"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {createMutation.isError && (
              <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                {(createMutation.error as any)?.response?.data?.message?.[0]
                  ?? (createMutation.error as any)?.response?.data?.message
                  ?? 'Erro ao criar curso'}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              {step === 2 && (
                <button onClick={() => setStep(1)} className="btn btn-secondary">
                  Voltar
                </button>
              )}
              {step === 1 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  disabled={!canProceed}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  Próximo →
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => createMutation.mutate()}
                  disabled={!canCreate || createMutation.isPending}
                  className="btn btn-primary flex-1 disabled:opacity-50 gap-2"
                >
                  {createMutation.isPending ? (
                    <><Zap size={14} className="animate-pulse" />Criando...</>
                  ) : (
                    <><Plus size={14} />Criar curso</>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="w-52 flex-shrink-0 p-5 space-y-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Preview</p>
            <div className="card p-4 space-y-3 border"
              style={{ borderColor: `${form.accentColor}30` }}>
              <div
                className="w-full aspect-square max-w-[80px] mx-auto rounded-2xl flex items-center justify-center font-display font-black text-3xl border"
                style={{
                  background: `${form.accentColor}18`,
                  borderColor: `${form.accentColor}35`,
                  color: form.accentColor,
                  boxShadow: `0 4px 20px ${form.accentColor}20`,
                }}
              >
                {form.abbr || '?'}
              </div>
              <div className="space-y-1 text-center">
                <p className="font-semibold text-xs text-text-primary leading-tight">
                  {form.title || 'Título do curso'}
                </p>
                <p className="text-[10px] text-text-muted">
                  {form.isFree ? 'Grátis' : form.price ? `R$ ${form.price}` : 'Pago'}
                </p>
              </div>
              <div
                className="text-[10px] px-2 py-1 rounded-full text-center font-semibold"
                style={{ background: `${form.accentColor}20`, color: form.accentColor }}
              >
                {form.level === 'BEGINNER' ? 'Iniciante' : form.level === 'INTERMEDIATE' ? 'Intermediário' : 'Avançado'}
              </div>
            </div>
            <p className="text-[10px] text-text-muted text-center leading-relaxed">
              Após criar, adicione módulos e aulas no editor
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteCourseModal({ course, onClose, onDeleted }: {
  course: any; onClose: () => void; onDeleted: () => void;
}) {
  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/courses/${course.id}`),
    onSuccess: () => {
      toast.success('Curso excluído');
      onDeleted();
    },
    onError: () => toast.error('Erro ao excluir curso'),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="card p-6 w-full max-w-sm space-y-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} className="text-red-400" />
        </div>
        <div>
          <h3 className="font-display font-bold text-text-primary">Excluir curso?</h3>
          <p className="text-sm text-text-secondary mt-1">
            <strong className="text-text-primary">"{course.title}"</strong> será removido permanentemente.
            Alunos matriculados perderão o acesso.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">Cancelar</button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="btn bg-red-500 hover:bg-red-600 text-white flex-1 gap-2"
          >
            {deleteMutation.isPending ? 'Excluindo...' : <><Trash2 size={14} />Excluir</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
