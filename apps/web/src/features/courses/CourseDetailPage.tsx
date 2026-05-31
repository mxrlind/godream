'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Star, Users, Clock, BookOpen, CheckCircle2, Lock,
  Play, ChevronDown, ChevronUp, Award, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiGet, apiPost } from '@/lib/api';
import { formatDuration, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Course, ApiResponse } from '@/types';

export function CourseDetailPage({ slug }: { slug: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => apiGet<any>(`/courses/${slug}`),
  });

  const course: Course | undefined = (data as any)?.data;

  const enrollMutation = useMutation({
    mutationFn: () => apiPost(`/courses/${course!.id}/enroll`, {}),
    onSuccess: () => {
      toast.success('Inscrito com sucesso! Comece a aprender.', { icon: '🎉' });
      qc.invalidateQueries({ queryKey: ['course', slug] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao se inscrever'),
  });

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    const firstLesson = course?.modules?.[0]?.lessons?.[0];
    if (firstLesson) {
      router.push(`/courses/${slug}/learn/${firstLesson.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!course) return <div className="card p-10 text-center text-text-muted">Curso não encontrado</div>;

  const isEnrolled = course.isEnrolled || !!course.enrollment;
  const lastLesson = course.enrollment?.lastLessonId;

  return (
    <div className="space-y-6 pb-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: course.thumbGrad ||
            `linear-gradient(135deg, ${course.accentColor}30 0%, ${course.accentColor}08 100%)`,
          border: `1px solid ${course.accentColor}30`,
        }}
      >
        <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Thumb */}
          <div
            className="w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${course.accentColor}40, ${course.accentColor}10)`,
              border: `2px solid ${course.accentColor}40`,
              boxShadow: `0 0 32px ${course.accentColor}20`,
            }}
          >
            <span
              className="font-display font-black text-4xl"
              style={{ color: course.accentColor, textShadow: `0 0 20px ${course.accentColor}60` }}
            >
              {course.abbr}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className={cn(
                'badge-purple text-xs font-bold uppercase tracking-wide',
                course.level === 'BEGINNER' && 'badge-cyan',
                course.level === 'ADVANCED' && 'badge-red',
              )}>
                {course.level === 'BEGINNER' ? 'Iniciante' : course.level === 'INTERMEDIATE' ? 'Intermediário' : 'Avançado'}
              </span>
              {course.isFree && <span className="badge-mint text-xs">Grátis</span>}
              {course.category && (
                <span className="badge-gold text-xs">{course.category.name}</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary">
              {course.title}
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">{course.shortDesc || course.description}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-text-dim">
              {course.avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-neon-gold fill-neon-gold" />
                  <span className="font-semibold text-text-secondary">{course.avgRating.toFixed(1)}</span>
                  <span>({course.ratingCount})</span>
                </div>
              )}
              <div className="flex items-center gap-1"><Users size={14} />{course.enrolledCount.toLocaleString()} alunos</div>
              <div className="flex items-center gap-1"><Clock size={14} />{formatDuration(course.totalDuration)}</div>
              <div className="flex items-center gap-1"><BookOpen size={14} />{course.totalLessons} aulas</div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {isEnrolled ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (lastLesson) {
                      router.push(`/courses/${slug}/learn/${lastLesson}`);
                    } else {
                      handleStart();
                    }
                  }}
                  className="btn btn-primary gap-2 py-3 px-6"
                >
                  <Play size={16} className="fill-white" />
                  {lastLesson ? 'Continuar aula' : 'Começar curso'}
                </motion.button>
              ) : course.isFree ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                  className="btn btn-primary gap-2 py-3 px-6"
                >
                  <Zap size={16} className="fill-white" />
                  Inscrever-se grátis
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/checkout/${course.id}`)}
                  className="btn btn-primary gap-2 py-3 px-6"
                >
                  Comprar por R$ {course.price?.toFixed(2).replace('.', ',')}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* What you'll learn */}
      {course.whatYouLearn?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="card p-6">
          <h2 className="font-display font-bold text-text-primary mb-4 flex items-center gap-2">
            <Award size={18} className="text-neon-gold" /> O que você vai aprender
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {course.whatYouLearn.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle2 size={14} className="text-neon-mint flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modules */}
      {course.modules && course.modules.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2">
          <h2 className="font-display font-bold text-text-primary">Conteúdo do curso</h2>
          {course.modules.map((mod) => (
            <div key={mod.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-surface-3/50 transition-colors text-left"
                onClick={() => toggleModule(mod.id)}
              >
                <div>
                  <span className="font-semibold text-sm text-text-primary">{mod.title}</span>
                  <span className="text-xs text-text-muted ml-2">{mod.lessons?.length ?? 0} aulas</span>
                </div>
                {expandedModules.has(mod.id) ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
              </button>
              {expandedModules.has(mod.id) && (
                <div className="border-t border-border divide-y divide-border/50">
                  {mod.lessons?.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-sm',
                        isEnrolled || lesson.isFree
                          ? 'cursor-pointer hover:bg-surface-3/40'
                          : 'cursor-not-allowed opacity-60',
                      )}
                      onClick={() => {
                        if (isEnrolled || lesson.isFree) {
                          router.push(`/courses/${slug}/learn/${lesson.id}`);
                        }
                      }}
                    >
                      {isEnrolled || lesson.isFree ? (
                        <Play size={13} className="text-neon-purple flex-shrink-0" />
                      ) : (
                        <Lock size={13} className="text-text-muted flex-shrink-0" />
                      )}
                      <span className="flex-1 text-text-secondary">{lesson.title}</span>
                      {lesson.isFree && !isEnrolled && (
                        <span className="badge-mint text-[10px] px-1.5">Grátis</span>
                      )}
                      <span className="text-text-muted text-xs">
                        {Math.round(lesson.duration / 60)}min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
