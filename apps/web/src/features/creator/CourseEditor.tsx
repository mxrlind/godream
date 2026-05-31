'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp,
  Save, Eye, Globe, Loader2, GripVertical, Video, FileText,
  BookOpen, CheckSquare, Zap, AlertCircle, X, CheckCircle2,
  Clock, Link2, AlignLeft, List, Settings,
} from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────
type LessonType = 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'EXERCISE' | 'CODE';

interface DeleteTarget {
  type: 'module' | 'lesson';
  id: string;
  name: string;
  lessonCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const LESSON_TYPES: Record<LessonType, { icon: React.ReactNode; label: string; color: string }> = {
  VIDEO:    { icon: <Video size={12} />,       label: 'Vídeo',     color: '#00e5ff' },
  DOCUMENT: { icon: <FileText size={12} />,    label: 'Documento', color: '#7c5cff' },
  QUIZ:     { icon: <CheckSquare size={12} />, label: 'Quiz',      color: '#ffd166' },
  EXERCISE: { icon: <BookOpen size={12} />,    label: 'Exercício', color: '#ff3df0' },
  CODE:     { icon: <Zap size={12} />,         label: 'Código',    color: '#39ff14' },
};

// ─── Completeness ─────────────────────────────────────────────────────────────
function computeChecklist(course: any, modules: any[]) {
  const published = modules.flatMap((m: any) => m.lessons || []).filter((l: any) => l.isPublished);
  return {
    'Título definido': !!course?.title && course.title.length >= 5,
    'Descrição completa': !!course?.description && course.description.length >= 20,
    'Categoria selecionada': !!course?.categoryId,
    'Ao menos 1 módulo': modules.length > 0,
    'Ao menos 1 aula publicada': published.length > 0,
    'O que você vai aprender': (course?.whatYouLearn?.length ?? 0) > 0,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function CourseEditor({ courseId }: { courseId: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showNewModule, setShowNewModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState({ title: '', type: 'VIDEO' as LessonType });

  // ─── Data ─────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['creator-course', courseId],
    queryFn: () => apiGet<any>(`/courses/editor/${courseId}`),
  });

  const course = (data as any)?.data ?? data;
  const modules: any[] = course?.modules ?? [];
  const allLessons = modules.flatMap((m: any) => m.lessons || []);
  const selectedLesson = allLessons.find((l: any) => l.id === selectedLessonId) ?? null;

  const checklist = computeChecklist(course, modules);
  const checkCount = Object.values(checklist).filter(Boolean).length;
  const checkTotal = Object.keys(checklist).length;
  const readinessPct = course ? Math.round((checkCount / checkTotal) * 100) : 0;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['creator-course', courseId] });
    qc.invalidateQueries({ queryKey: ['creator', 'courses'] });
  };

  // ─── Mutations ────────────────────────────────────────────────
  const publishMutation = useMutation({
    mutationFn: () => apiPatch(`/courses/${courseId}/publish`, {}),
    onSuccess: () => { toast.success('Curso publicado! 🎉'); invalidate(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao publicar'),
  });

  const createModuleMutation = useMutation({
    mutationFn: (title: string) =>
      apiPost(`/courses/${courseId}/modules`, { title, order: modules.length }),
    onSuccess: (res: any) => {
      toast.success('Módulo criado!');
      setNewModuleTitle('');
      setShowNewModule(false);
      const newId = res?.data?.id ?? res?.id;
      if (newId) setExpandedModules((prev) => new Set([...prev, newId]));
      invalidate();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao criar módulo'),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/courses/${courseId}/modules/${id}`),
    onSuccess: () => { toast.success('Módulo removido'); setDeleteTarget(null); invalidate(); },
    onError: () => toast.error('Erro ao remover módulo'),
  });

  const createLessonMutation = useMutation({
    mutationFn: ({ moduleId, title, type }: { moduleId: string; title: string; type: LessonType }) => {
      const mod = modules.find((m: any) => m.id === moduleId);
      return apiPost('/lessons', {
        moduleId, title, type,
        order: mod?.lessons?.length ?? 0,
        isFree: false,
        isPublished: false,
      });
    },
    onSuccess: (res: any) => {
      toast.success('Aula criada! Clique nela para editar.');
      setAddingLessonTo(null);
      setNewLesson({ title: '', type: 'VIDEO' });
      const lessonId = res?.data?.id ?? res?.id;
      if (lessonId) setSelectedLessonId(lessonId);
      invalidate();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao criar aula'),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/lessons/${id}`),
    onSuccess: () => {
      toast.success('Aula removida');
      if (selectedLessonId === deleteTarget?.id) setSelectedLessonId(null);
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast.error('Erro ao remover aula'),
  });

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'module') deleteModuleMutation.mutate(deleteTarget.id);
    else deleteLessonMutation.mutate(deleteTarget.id);
  };

  const toggleModule = (id: string) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ─── Loading / Error ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="flex gap-4">
          <div className="w-80 space-y-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
          <Skeleton className="flex-1 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="card p-12 text-center space-y-3">
        <AlertCircle size={36} className="mx-auto text-text-muted" />
        <p className="text-text-secondary">Curso não encontrado ou acesso negado</p>
        <button onClick={() => router.back()} className="btn btn-ghost gap-2">
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══ Header ══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 flex items-center gap-4 flex-wrap"
      >
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-icon flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Course avatar */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-base flex-shrink-0"
          style={{ background: `${course.accentColor}20`, color: course.accentColor, border: `1.5px solid ${course.accentColor}35` }}
        >
          {course.abbr}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-bold text-text-primary leading-tight truncate">
              {course.title}
            </h1>
            <StatusBadge status={course.status} />
          </div>

          {/* Readiness bar */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-32 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readinessPct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background:
                    readinessPct >= 100 ? '#39ff14'
                    : readinessPct >= 60  ? '#7c5cff'
                    : '#ffd166',
                }}
              />
            </div>
            <span className="text-[11px] text-text-muted">{readinessPct}% pronto para publicar</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/courses/${course.slug}`)}
            className="btn btn-ghost gap-1.5 text-sm"
          >
            <Eye size={14} />
            Preview
          </motion.button>

          {course.status !== 'PUBLISHED' && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="btn btn-primary gap-1.5 text-sm disabled:opacity-50"
            >
              {publishMutation.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <Globe size={14} />}
              Publicar
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ═══ Tabs ════════════════════════════════════════════════ */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl w-fit">
        {[
          { id: 'content',  label: 'Conteúdo' },
          { id: 'settings', label: 'Configurações' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-surface-1 text-text-primary shadow-sm'
                : 'text-text-dim hover:text-text-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab body ════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 'content' ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex gap-4 items-start"
          >
            {/* ── Left: module/lesson tree ───────────────────── */}
            <div className="w-80 flex-shrink-0 space-y-2">
              <AnimatePresence initial={false}>
                {modules.map((mod: any, i: number) => (
                  <ModuleRow
                    key={mod.id}
                    module={mod}
                    index={i}
                    expanded={expandedModules.has(mod.id)}
                    selectedLessonId={selectedLessonId}
                    addingLessonTo={addingLessonTo}
                    newLesson={newLesson}
                    isCreatingLesson={createLessonMutation.isPending}
                    onToggle={() => toggleModule(mod.id)}
                    onSelectLesson={(id: string) =>
                      setSelectedLessonId((prev) => (prev === id ? null : id))
                    }
                    onDeleteModule={() =>
                      setDeleteTarget({
                        type: 'module',
                        id: mod.id,
                        name: mod.title,
                        lessonCount: mod.lessons?.length ?? 0,
                      })
                    }
                    onDeleteLesson={(lesson: any) =>
                      setDeleteTarget({ type: 'lesson', id: lesson.id, name: lesson.title })
                    }
                    onAddLesson={() => {
                      setAddingLessonTo(mod.id);
                      setExpandedModules((prev) => new Set([...prev, mod.id]));
                    }}
                    onCancelAddLesson={() => {
                      setAddingLessonTo(null);
                      setNewLesson({ title: '', type: 'VIDEO' });
                    }}
                    onNewLessonChange={setNewLesson}
                    onCreateLesson={() => {
                      if (newLesson.title.trim())
                        createLessonMutation.mutate({
                          moduleId: mod.id,
                          title: newLesson.title.trim(),
                          type: newLesson.type,
                        });
                    }}
                  />
                ))}
              </AnimatePresence>

              {/* Add module */}
              <AnimatePresence mode="wait">
                {showNewModule ? (
                  <motion.div
                    key="new-mod-form"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="card p-3 flex items-center gap-2"
                  >
                    <input
                      autoFocus
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newModuleTitle.trim())
                          createModuleMutation.mutate(newModuleTitle.trim());
                        if (e.key === 'Escape') setShowNewModule(false);
                      }}
                      placeholder="Nome do módulo..."
                      className="input flex-1 text-sm py-1.5"
                    />
                    <button
                      onClick={() => {
                        if (newModuleTitle.trim())
                          createModuleMutation.mutate(newModuleTitle.trim());
                      }}
                      disabled={!newModuleTitle.trim() || createModuleMutation.isPending}
                      className="btn btn-primary btn-icon disabled:opacity-50"
                    >
                      {createModuleMutation.isPending
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Save size={13} />}
                    </button>
                    <button
                      onClick={() => { setShowNewModule(false); setNewModuleTitle(''); }}
                      className="btn btn-ghost btn-icon"
                    >
                      <X size={13} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="add-mod-btn"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowNewModule(true)}
                    className="w-full card p-3 flex items-center justify-center gap-2 text-sm text-text-dim hover:text-neon-cyan hover:border-neon-cyan/30 transition-all border-dashed"
                  >
                    <Plus size={14} />
                    Novo módulo
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right: detail / checklist ──────────────────── */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {selectedLesson ? (
                  <motion.div
                    key={selectedLesson.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <LessonDetailPanel
                      lesson={selectedLesson}
                      onRefresh={invalidate}
                      onClose={() => setSelectedLessonId(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="checklist"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <CourseChecklist
                      checklist={checklist}
                      score={checkCount}
                      total={checkTotal}
                      onGoToSettings={() => setActiveTab('settings')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            <SettingsTab courseId={courseId} course={course} onRefresh={invalidate} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Delete modal ════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            target={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onClose={() => setDeleteTarget(null)}
            isPending={deleteModuleMutation.isPending || deleteLessonMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Module Row ───────────────────────────────────────────────────────────────
function ModuleRow({
  module: mod, index, expanded, selectedLessonId,
  addingLessonTo, newLesson, isCreatingLesson,
  onToggle, onSelectLesson, onDeleteModule, onDeleteLesson,
  onAddLesson, onCancelAddLesson, onNewLessonChange, onCreateLesson,
}: any) {
  const isAddingHere = addingLessonTo === mod.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card overflow-hidden"
    >
      {/* Module header */}
      <div className="flex items-center gap-2 p-3 group/mod">
        <GripVertical size={14} className="text-text-muted cursor-grab flex-shrink-0" />
        <button
          className="flex-1 flex items-center justify-between text-left min-w-0 gap-2"
          onClick={onToggle}
        >
          <div className="min-w-0">
            <p className="font-semibold text-sm text-text-primary truncate">{mod.title}</p>
            <p className="text-[11px] text-text-muted">
              {mod.lessons?.length ?? 0} aula{(mod.lessons?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          {expanded
            ? <ChevronUp size={14} className="text-text-muted flex-shrink-0" />
            : <ChevronDown size={14} className="text-text-muted flex-shrink-0" />}
        </button>
        <button
          onClick={onDeleteModule}
          className="btn btn-ghost btn-icon w-7 h-7 text-text-muted hover:text-neon-magenta opacity-0 group-hover/mod:opacity-100 transition-all flex-shrink-0"
          title="Remover módulo"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Lessons */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {(mod.lessons || []).map((lesson: any) => {
                const meta = LESSON_TYPES[lesson.type as LessonType] || LESSON_TYPES.VIDEO;
                const isSelected = selectedLessonId === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer group/lesson transition-all border-l-2',
                      isSelected
                        ? 'bg-neon-cyan/5 border-neon-cyan'
                        : 'border-transparent hover:bg-surface-3/50 hover:border-surface-3',
                    )}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.color}18`, color: meta.color }}
                    >
                      {meta.icon}
                    </div>
                    <span
                      className={cn(
                        'text-xs flex-1 truncate',
                        isSelected ? 'text-text-primary font-medium' : 'text-text-secondary',
                      )}
                    >
                      {lesson.title}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {lesson.isFree && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-neon-mint/15 text-neon-mint font-semibold">
                          GRÁTIS
                        </span>
                      )}
                      {!lesson.isPublished && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-surface-3 text-text-muted font-semibold">
                          DRAFT
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson); }}
                        className="btn btn-ghost w-5 h-5 p-0 text-text-muted hover:text-neon-magenta opacity-0 group-hover/lesson:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add lesson */}
              <div className="px-3 py-2 border-t border-border/40">
                <AnimatePresence mode="wait">
                  {isAddingHere ? (
                    <motion.div
                      key="add-lesson-form"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="space-y-2"
                    >
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          value={newLesson.title}
                          onChange={(e) => onNewLessonChange({ ...newLesson, title: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newLesson.title.trim()) onCreateLesson();
                            if (e.key === 'Escape') onCancelAddLesson();
                          }}
                          placeholder="Título da aula..."
                          className="input flex-1 text-xs py-1.5"
                        />
                        <select
                          value={newLesson.type}
                          onChange={(e) => onNewLessonChange({ ...newLesson, type: e.target.value })}
                          className="input text-xs py-1.5 w-24"
                        >
                          {Object.entries(LESSON_TYPES).map(([t, m]) => (
                            <option key={t} value={t}>{(m as any).label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={onCreateLesson}
                          disabled={!newLesson.title.trim() || isCreatingLesson}
                          className="btn btn-primary text-xs py-1 px-3 gap-1 flex-1 disabled:opacity-50"
                        >
                          {isCreatingLesson ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Criar
                        </button>
                        <button onClick={onCancelAddLesson} className="btn btn-ghost text-xs py-1 px-2">
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add-lesson-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={onAddLesson}
                      className="w-full flex items-center justify-center gap-1 text-[11px] text-text-dim hover:text-neon-purple py-1.5 rounded-lg hover:bg-surface-3/50 transition-all"
                    >
                      <Plus size={11} />
                      Adicionar aula
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Lesson Detail Panel ──────────────────────────────────────────────────────
function LessonDetailPanel({
  lesson,
  onRefresh,
  onClose,
}: {
  lesson: any;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: lesson.title || '',
    type: (lesson.type || 'VIDEO') as LessonType,
    description: lesson.description || '',
    videoUrl: lesson.videoUrl || '',
    fileUrl: lesson.fileUrl || '',
    content: lesson.content || '',
    durationMin: lesson.duration ? Math.round(lesson.duration / 60) : 0,
    isFree: lesson.isFree ?? false,
    isPublished: lesson.isPublished ?? false,
  });

  // Sync when lesson changes
  useEffect(() => {
    setForm({
      title: lesson.title || '',
      type: (lesson.type || 'VIDEO') as LessonType,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      fileUrl: lesson.fileUrl || '',
      content: lesson.content || '',
      durationMin: lesson.duration ? Math.round(lesson.duration / 60) : 0,
      isFree: lesson.isFree ?? false,
      isPublished: lesson.isPublished ?? false,
    });
  }, [lesson.id]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiPatch(`/lessons/${lesson.id}`, {
        title: form.title,
        type: form.type,
        description: form.description || undefined,
        videoUrl: form.videoUrl || undefined,
        fileUrl: form.fileUrl || undefined,
        content: form.content || undefined,
        duration: form.durationMin * 60,
        isFree: form.isFree,
        isPublished: form.isPublished,
      }),
    onSuccess: () => { toast.success('Aula salva!'); onRefresh(); },
    onError: () => toast.error('Erro ao salvar aula'),
  });

  const meta = LESSON_TYPES[form.type] || LESSON_TYPES.VIDEO;
  const hasContent = form.type === 'QUIZ' || form.type === 'EXERCISE' || form.type === 'CODE';

  return (
    <div className="card p-5 space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${meta.color}18`, color: meta.color }}
          >
            {meta.icon}
          </div>
          <h2 className="font-semibold text-sm text-text-primary">Editar aula</h2>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-icon text-text-muted">
          <X size={14} />
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="label">Título *</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input w-full"
          placeholder="Título da aula"
        />
      </div>

      {/* Type selector */}
      <div>
        <label className="label">Tipo</label>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.entries(LESSON_TYPES) as [LessonType, typeof LESSON_TYPES[LessonType]][]).map(([t, m]) => (
            <button
              key={t}
              onClick={() => setForm({ ...form, type: t })}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                form.type === t
                  ? 'border-transparent'
                  : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
              )}
              style={
                form.type === t
                  ? { background: `${m.color}18`, color: m.color, borderColor: `${m.color}40` }
                  : undefined
              }
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Video URL */}
      {form.type === 'VIDEO' && (
        <div>
          <label className="label flex items-center gap-1.5">
            <Link2 size={11} />
            URL do Vídeo
          </label>
          <input
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            className="input w-full font-mono text-sm"
            placeholder="https://..."
          />
        </div>
      )}

      {/* File URL */}
      {form.type === 'DOCUMENT' && (
        <div>
          <label className="label flex items-center gap-1.5">
            <Link2 size={11} />
            URL do Arquivo
          </label>
          <input
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className="input w-full font-mono text-sm"
            placeholder="https://..."
          />
        </div>
      )}

      {/* Markdown content */}
      {hasContent && (
        <div>
          <label className="label flex items-center gap-1.5">
            <AlignLeft size={11} />
            Conteúdo <span className="text-text-muted font-normal">(Markdown)</span>
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="input w-full resize-none font-mono text-sm"
            rows={6}
            placeholder={
              form.type === 'CODE'
                ? '```js\n// seu código aqui\n```'
                : form.type === 'QUIZ'
                ? '**Pergunta:** ...\n\n- [ ] Opção A\n- [x] Opção B (correta)'
                : '## Exercício\n\n**Objetivo:** ...'
            }
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="label">Descrição <span className="text-text-muted font-normal">(opcional)</span></label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input w-full resize-none text-sm"
          rows={2}
          placeholder="Breve descrição do que será abordado..."
        />
      </div>

      {/* Duration */}
      <div>
        <label className="label flex items-center gap-1.5">
          <Clock size={11} />
          Duração (minutos)
        </label>
        <input
          type="number"
          value={form.durationMin}
          onChange={(e) => setForm({ ...form, durationMin: Math.max(0, parseInt(e.target.value) || 0) })}
          className="input w-32"
          min={0}
          max={999}
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-2.5">
        <button
          onClick={() => setForm({ ...form, isFree: !form.isFree })}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all',
            form.isFree
              ? 'bg-neon-mint/15 border-neon-mint/40 text-neon-mint'
              : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
          )}
        >
          {form.isFree ? '✓' : '○'} Acesso gratuito
        </button>
        <button
          onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all',
            form.isPublished
              ? 'bg-neon-purple/15 border-neon-purple/40 text-neon-purple'
              : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
          )}
        >
          {form.isPublished ? '✓' : '○'} Publicada
        </button>
      </div>

      {/* Save */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => updateMutation.mutate()}
        disabled={!form.title.trim() || updateMutation.isPending}
        className="w-full btn btn-primary gap-2 disabled:opacity-50"
      >
        {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Salvar aula
      </motion.button>
    </div>
  );
}

// ─── Course Checklist ─────────────────────────────────────────────────────────
function CourseChecklist({
  checklist,
  score,
  total,
  onGoToSettings,
}: {
  checklist: Record<string, boolean>;
  score: number;
  total: number;
  onGoToSettings: () => void;
}) {
  const pct = Math.round((score / total) * 100);

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-text-primary">Checklist de publicação</h2>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: pct >= 100 ? '#39ff14' : pct >= 60 ? '#7c5cff' : '#ffd166' }}
        >
          {score}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: pct >= 100 ? '#39ff14' : pct >= 60 ? '#7c5cff' : '#ffd166' }}
        />
      </div>

      {/* Items */}
      <div className="space-y-3">
        {Object.entries(checklist).map(([label, done]) => (
          <div key={label} className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                done ? 'bg-neon-mint/20 text-neon-mint' : 'bg-surface-3',
              )}
            >
              {done
                ? <CheckCircle2 size={12} />
                : <div className="w-1.5 h-1.5 rounded-full bg-text-muted/50" />}
            </div>
            <span
              className={cn(
                'text-xs transition-colors',
                done ? 'text-text-muted line-through' : 'text-text-secondary',
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {score === total ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-xl bg-neon-mint/10 border border-neon-mint/25 text-center"
        >
          <p className="text-xs font-semibold text-neon-mint">
            🎉 Tudo pronto! Use o botão Publicar no cabeçalho.
          </p>
        </motion.div>
      ) : (
        <button
          onClick={onGoToSettings}
          className="w-full btn btn-ghost text-xs gap-1.5 text-text-dim hover:text-neon-cyan"
        >
          <Settings size={12} />
          Completar no Configurações
        </button>
      )}

      {/* Hint */}
      <p className="text-[11px] text-text-muted text-center leading-relaxed">
        Clique em uma aula na árvore à esquerda para editá-la aqui.
      </p>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({
  courseId,
  course,
  onRefresh,
}: {
  courseId: string;
  course: any;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({
    title: course.title || '',
    description: course.description || '',
    shortDesc: course.shortDesc || '',
    accentColor: course.accentColor || '#7c5cff',
    level: course.level || 'BEGINNER',
    isFree: course.isFree ?? true,
    price: course.price ? String(course.price) : '',
    language: course.language || 'pt-BR',
    tags: course.tags?.join(', ') || '',
    requirements: (course.requirements as string[]) || [],
    whatYouLearn: (course.whatYouLearn as string[]) || [],
  });
  const [newReq, setNewReq] = useState('');
  const [newWyl, setNewWyl] = useState('');
  const [categoryId, setCategoryId] = useState(course.categoryId || '');

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<any>('/courses/categories'),
  });
  const categories: any[] = (catData as any)?.data ?? catData ?? [];

  const updateMutation = useMutation({
    mutationFn: () =>
      apiPut(`/courses/${courseId}`, {
        title: form.title,
        description: form.description,
        shortDesc: form.shortDesc || undefined,
        accentColor: form.accentColor,
        level: form.level,
        isFree: form.isFree,
        price: form.isFree ? undefined : parseFloat(form.price) || undefined,
        language: form.language,
        categoryId: categoryId || undefined,
        tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        requirements: form.requirements,
        whatYouLearn: form.whatYouLearn,
      }),
    onSuccess: () => { toast.success('Configurações salvas!'); onRefresh(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao salvar'),
  });

  const addItem = (key: 'requirements' | 'whatYouLearn', val: string) => {
    if (!val.trim()) return;
    setForm({ ...form, [key]: [...form[key], val.trim()] });
    if (key === 'requirements') setNewReq('');
    else setNewWyl('');
  };
  const removeItem = (key: 'requirements' | 'whatYouLearn', i: number) =>
    setForm({ ...form, [key]: form[key].filter((_: string, idx: number) => idx !== i) });

  const COLOR_PRESETS = ['#7c5cff', '#00e5ff', '#ff3df0', '#ffd166', '#39ff14', '#ff6b35'];

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* ── Left ──────────────────────────────────── */}
      <div className="space-y-5">

        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-text-primary border-b border-border pb-2">
            Informações básicas
          </h3>

          <div>
            <label className="label">Título do curso</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input w-full"
              placeholder="Título"
              maxLength={120}
            />
            <p className="text-[11px] text-text-muted mt-1">{form.title.length}/120</p>
          </div>

          <div>
            <label className="label">Resumo <span className="text-text-muted font-normal">(até 200 chars)</span></label>
            <input
              value={form.shortDesc}
              onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
              className="input w-full"
              placeholder="Uma linha que descreve o curso"
              maxLength={200}
            />
          </div>

          <div>
            <label className="label">Descrição completa</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full resize-none"
              rows={5}
              placeholder="Explique em detalhe o que o aluno vai aprender..."
            />
            <p className="text-[11px] text-text-muted mt-1">{form.description.length} caracteres</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-text-primary border-b border-border pb-2">
            Metadados
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nível</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="input w-full"
              >
                <option value="BEGINNER">Iniciante</option>
                <option value="INTERMEDIATE">Intermediário</option>
                <option value="ADVANCED">Avançado</option>
              </select>
            </div>
            <div>
              <label className="label">Idioma</label>
              <input
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="input w-full"
                placeholder="pt-BR"
              />
            </div>
          </div>

          <div>
            <label className="label">Categoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input w-full"
            >
              <option value="">Selecione uma categoria</option>
              {Array.isArray(categories) && categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Cor de destaque</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-surface-2 flex-shrink-0"
              />
              <input
                value={form.accentColor}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                className="input flex-1 font-mono text-sm"
                placeholder="#7c5cff"
              />
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, accentColor: c })}
                  className="w-5 h-5 rounded-full border-2 transition-all flex-shrink-0 hover:scale-110"
                  style={{ background: c, borderColor: form.accentColor === c ? '#fff' : 'transparent' }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="label">Tags <span className="text-text-muted font-normal">(separadas por vírgula)</span></label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="input w-full"
              placeholder="javascript, frontend, react"
            />
          </div>
        </div>
      </div>

      {/* ── Right ─────────────────────────────────── */}
      <div className="space-y-5">

        {/* What you'll learn */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-sm text-text-primary border-b border-border pb-2 flex items-center gap-2">
            <CheckCircle2 size={13} className="text-neon-mint" />
            O que você vai aprender
          </h3>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {form.whatYouLearn.length === 0 && (
              <p className="text-xs text-text-muted italic">Nenhum item ainda</p>
            )}
            {form.whatYouLearn.map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-2 group/item">
                <CheckCircle2 size={11} className="text-neon-mint flex-shrink-0 mt-0.5" />
                <span className="text-xs text-text-secondary flex-1">{item}</span>
                <button
                  onClick={() => removeItem('whatYouLearn', i)}
                  className="btn btn-ghost w-5 h-5 p-0 text-text-muted hover:text-neon-magenta opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newWyl}
              onChange={(e) => setNewWyl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem('whatYouLearn', newWyl); }}
              className="input flex-1 text-sm py-1.5"
              placeholder="Ex: Criar componentes React reutilizáveis"
            />
            <button
              onClick={() => addItem('whatYouLearn', newWyl)}
              disabled={!newWyl.trim()}
              className="btn btn-ghost btn-icon disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-sm text-text-primary border-b border-border pb-2 flex items-center gap-2">
            <List size={13} className="text-neon-cyan" />
            Pré-requisitos
          </h3>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {form.requirements.length === 0 && (
              <p className="text-xs text-text-muted italic">Nenhum pré-requisito listado</p>
            )}
            {form.requirements.map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-2 group/req">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan flex-shrink-0 mt-1.5" />
                <span className="text-xs text-text-secondary flex-1">{item}</span>
                <button
                  onClick={() => removeItem('requirements', i)}
                  className="btn btn-ghost w-5 h-5 p-0 text-text-muted hover:text-neon-magenta opacity-0 group-hover/req:opacity-100 transition-opacity flex-shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem('requirements', newReq); }}
              className="input flex-1 text-sm py-1.5"
              placeholder="Ex: Conhecimento básico de JavaScript"
            />
            <button
              onClick={() => addItem('requirements', newReq)}
              disabled={!newReq.trim()}
              className="btn btn-ghost btn-icon disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-sm text-text-primary border-b border-border pb-2">
            Preço & Acesso
          </h3>

          <div className="flex gap-2">
            <button
              onClick={() => setForm({ ...form, isFree: true })}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                form.isFree
                  ? 'bg-neon-mint/15 border-neon-mint/40 text-neon-mint'
                  : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
              )}
            >
              Gratuito
            </button>
            <button
              onClick={() => setForm({ ...form, isFree: false })}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                !form.isFree
                  ? 'bg-neon-gold/15 border-neon-gold/40 text-neon-gold'
                  : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
              )}
            >
              Pago
            </button>
          </div>

          <AnimatePresence>
            {!form.isFree && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="w-full btn btn-primary gap-2 py-3 text-base"
        >
          {updateMutation.isPending
            ? <Loader2 size={16} className="animate-spin" />
            : <Save size={16} />}
          Salvar todas as alterações
        </motion.button>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({
  target,
  onConfirm,
  onClose,
  isPending,
}: {
  target: DeleteTarget;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 8 }}
        className="card p-6 max-w-sm w-full space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-neon-magenta/15 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-neon-magenta" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text-primary">
              Excluir {target.type === 'module' ? 'módulo' : 'aula'}
            </h3>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-text-primary">"{target.name}"</span>?
              {target.type === 'module' && (target.lessonCount ?? 0) > 0 && (
                <>
                  {' '}Isso também removerá{' '}
                  <span className="text-neon-magenta font-semibold">
                    {target.lessonCount} aula{target.lessonCount !== 1 ? 's' : ''}
                  </span>
                  {' '}permanentemente.
                </>
              )}
              {target.type === 'lesson' && ' Esta ação é irreversível.'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 btn btn-ghost">
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 btn gap-2 disabled:opacity-50"
            style={{ background: '#ff3df012', color: '#ff3df0', border: '1px solid #ff3df030' }}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Excluir
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PUBLISHED:      { label: 'Publicado',  cls: 'badge-mint' },
    DRAFT:          { label: 'Rascunho',   cls: 'badge-purple' },
    PENDING_REVIEW: { label: 'Em revisão', cls: 'badge-gold' },
    ARCHIVED:       { label: 'Arquivado',  cls: 'badge-red' },
    REJECTED:       { label: 'Rejeitado',  cls: 'badge-red' },
  };
  const s = map[status] || { label: status, cls: 'badge-purple' };
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold', s.cls)}>
      {s.label}
    </span>
  );
}
