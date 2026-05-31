'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useRef } from 'react';
import { apiGet } from '@/lib/api';
import { LessonPlayer } from '@/features/player/LessonPlayer';
import { LessonComments } from '@/features/player/LessonComments';
import { CourseQA } from '@/features/community/CourseQA';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { CheckCircle2, BookOpen, MessageCircle, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Course, Lesson } from '@/types';

type Tab = 'comments' | 'qa';

interface LessonPageProps {
  slug: string;
  lessonId: string;
}

export function LessonPage({ slug, lessonId }: LessonPageProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('comments');
  const [currentTime, setCurrentTime] = useState(0);
  const seekRef = useRef<((s: number) => void) | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => apiGet<any>(`/courses/${slug}`),
  });

  const course: Course | undefined = (data as any)?.data;

  const allLessons: Lesson[] = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
    );
  }, [course]);

  const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  const lesson = allLessons[lessonIndex];

  const completedIds = useMemo(() => {
    // Derive from enrollment progress if available
    return new Set<string>();
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="card p-10 text-center">
        <p className="text-text-secondary">Aula não encontrada</p>
      </div>
    );
  }

  const navigateToLesson = (idx: number) => {
    const target = allLessons[idx];
    if (target) router.push(`/courses/${slug}/learn/${target.id}`);
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Main content */}
      <div className={cn('flex-1 min-w-0 space-y-6', sidebarOpen ? 'lg:pr-0' : '')}>
        <LessonPlayer
          lesson={lesson}
          courseId={course.id}
          courseTitle={course.title}
          allLessons={allLessons}
          lessonIndex={lessonIndex}
          onPrev={() => navigateToLesson(lessonIndex - 1)}
          onNext={() => navigateToLesson(lessonIndex + 1)}
          onComplete={() => qc.invalidateQueries({ queryKey: ['enrollment', course.id] })}
          isCompleted={completedIds.has(lesson.id)}
          onTimeUpdate={setCurrentTime}
          onSeekRef={seekRef}
        />

        {/* ─── Comment/Q&A Tabs ─────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {(
              [
                { key: 'comments', icon: MessageCircle, label: 'Comentários' },
                { key: 'qa', icon: HelpCircle, label: 'Perguntas & Respostas' },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors',
                  activeTab === key
                    ? 'border-neon-purple text-neon-purple'
                    : 'border-transparent text-text-dim hover:text-text-secondary',
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'comments' && (
              <LessonComments
                lessonId={lesson.id}
                currentTime={currentTime}
                onSeek={(s) => seekRef.current?.(s)}
              />
            )}
            {activeTab === 'qa' && (
              <CourseQA courseId={course.id} />
            )}
          </div>
        </div>
      </div>

      {/* Sidebar — module/lessons list */}
      {sidebarOpen && course.modules && (
        <div className="hidden lg:flex flex-col w-80 flex-shrink-0 space-y-2 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between px-1 mb-1">
            <h3 className="text-sm font-semibold text-text-primary">Conteúdo</h3>
            <span className="text-xs text-text-muted">{allLessons.length} aulas</span>
          </div>
          {course.modules.map((mod) => (
            <div key={mod.id} className="card overflow-hidden">
              <div className="px-3 py-2 bg-surface-3/40 border-b border-border">
                <span className="text-xs font-semibold text-text-secondary">{mod.title}</span>
              </div>
              <div className="divide-y divide-border/40">
                {mod.lessons.map((l) => {
                  const isActive = l.id === lessonId;
                  const isDone = completedIds.has(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => router.push(`/courses/${slug}/learn/${l.id}`)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors',
                        isActive
                          ? 'bg-neon-purple/15 text-neon-purple'
                          : 'text-text-secondary hover:bg-surface-3/50',
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 size={13} className="text-neon-mint flex-shrink-0" />
                      ) : (
                        <BookOpen size={13} className="text-text-muted flex-shrink-0" />
                      )}
                      <span className="flex-1 leading-snug line-clamp-2">{l.title}</span>
                      <span className="text-text-muted tabular-nums flex-shrink-0">
                        {Math.round(l.duration / 60)}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
