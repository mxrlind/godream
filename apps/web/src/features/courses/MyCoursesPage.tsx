'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BookOpen, PlayCircle, CheckCircle2, Clock, Trophy, ArrowRight, Search,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  abbr: string;
  accentColor: string | null;
  totalLessons: number;
  completedLessons?: number;
  lastLessonId?: string;
  instructor?: string;
  category?: string;
  isCompleted?: boolean;
}

function CourseProgressCard({ course }: { course: EnrolledCourse }) {
  const progress = course.totalLessons
    ? Math.round(((course.completedLessons ?? 0) / course.totalLessons) * 100)
    : 0;
  const isCompleted = course.isCompleted ?? progress === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="card group overflow-hidden"
    >
      {/* Thumbnail / Abbr */}
      <div
        className="relative h-36 flex items-center justify-center overflow-hidden"
        style={{ background: course.accentColor || 'linear-gradient(135deg,#7c5cff,#00e5ff)' }}
      >
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-display font-black text-white/90 tracking-tight select-none">
            {course.abbr}
          </span>
        )}

        {/* Completion badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-neon-mint/20 border border-neon-mint/50 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-neon-mint" />
          </div>
        )}

        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: isCompleted ? '#39ff14' : '#7c5cff' }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-text-primary line-clamp-2 leading-snug text-sm">{course.title}</h3>
          {course.instructor && (
            <p className="text-xs text-text-muted mt-1">{course.instructor}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-text-dim">
          <div className="flex items-center gap-1.5">
            <BookOpen size={12} />
            <span>{course.completedLessons ?? 0}/{course.totalLessons} aulas</span>
          </div>
          <span
            className="font-semibold"
            style={{ color: isCompleted ? '#39ff14' : '#7c5cff' }}
          >
            {progress}%
          </span>
        </div>

        <Link
          href={
            course.lastLessonId
              ? `/courses/${course.slug}/learn/${course.lastLessonId}`
              : `/courses/${course.slug}`
          }
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold transition-colors text-white"
          style={{ background: isCompleted ? 'rgba(57,255,20,0.15)' : 'rgba(124,92,255,0.2)', border: `1px solid ${isCompleted ? 'rgba(57,255,20,0.35)' : 'rgba(124,92,255,0.4)'}` }}
        >
          {isCompleted ? (
            <>
              <Trophy size={13} className="text-neon-mint" />
              <span className="text-neon-mint">Ver certificado</span>
            </>
          ) : (
            <>
              <PlayCircle size={13} />
              {(course.completedLessons ?? 0) === 0 ? 'Começar' : 'Continuar'}
              <ArrowRight size={12} />
            </>
          )}
        </Link>
      </div>
    </motion.div>
  );
}

export function MyCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => apiGet<any>('/courses/my-courses'),
  });

  const courses: EnrolledCourse[] = (data as any)?.data ?? (data as any) ?? [];

  const inProgress = courses.filter((c) => !c.isCompleted && (c.completedLessons ?? 0) > 0);
  const notStarted = courses.filter((c) => (c.completedLessons ?? 0) === 0);
  const completed = courses.filter((c) => c.isCompleted);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="h-36 bg-surface-3" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-surface-3 rounded w-3/4" />
                <div className="h-3 bg-surface-3 rounded w-1/2" />
                <div className="h-8 bg-surface-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
          <BookOpen size={32} className="text-text-muted" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-text-primary">Nenhum curso ainda</h2>
          <p className="text-text-secondary text-sm mt-2">Explore nosso catálogo e comece sua jornada de aprendizado.</p>
        </div>
        <Link href="/courses" className="btn btn-primary gap-2">
          <Search size={16} />
          Explorar cursos
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Meus Cursos</h1>
          <p className="text-text-secondary text-sm mt-1">{courses.length} curso{courses.length !== 1 ? 's' : ''} na sua biblioteca</p>
        </div>
        <Link href="/courses" className="btn btn-ghost text-sm gap-1.5">
          <Search size={14} />
          Explorar
        </Link>
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-neon-cyan" />
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Em Progresso</h2>
            <span className="text-xs text-text-dim">({inProgress.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inProgress.map((c) => <CourseProgressCard key={c.id} course={c} />)}
          </div>
        </section>
      )}

      {/* Not Started */}
      {notStarted.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <PlayCircle size={15} className="text-neon-purple" />
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Para Começar</h2>
            <span className="text-xs text-text-dim">({notStarted.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notStarted.map((c) => <CourseProgressCard key={c.id} course={c} />)}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={15} className="text-neon-mint" />
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Concluídos</h2>
            <span className="text-xs text-text-dim">({completed.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {completed.map((c) => <CourseProgressCard key={c.id} course={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
