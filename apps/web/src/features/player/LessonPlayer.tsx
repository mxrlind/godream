'use client';

import { useEffect, useRef, useState, useCallback, MutableRefObject } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle2, BookOpen,
  FileText, Play, Clock, Award, Zap,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useGamificationStore } from '@/store/gamification.store';
import { apiPost, apiPatch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'EXERCISE' | 'LIVE' | 'CODE';
  duration: number;
  muxPlaybackId?: string;
  videoUrl?: string;
  fileUrl?: string;
  content?: string;
  moduleTitle?: string;
  isFree: boolean;
}

interface Props {
  lesson: Lesson;
  courseId: string;
  courseTitle: string;
  allLessons: Lesson[];
  lessonIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
  isCompleted: boolean;
  onTimeUpdate?: (seconds: number) => void;
  onSeekRef?: MutableRefObject<((s: number) => void) | null>;
}

export function LessonPlayer({
  lesson, courseId, courseTitle, allLessons, lessonIndex,
  onPrev, onNext, onComplete, isCompleted, onTimeUpdate, onSeekRef,
}: Props) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [completedLocally, setCompletedLocally] = useState(isCompleted);
  const [showCompleteAnim, setShowCompleteAnim] = useState(false);
  const qc = useQueryClient();

  const { awardXpLocal, awardCoinsLocal, addXpBurst } = useGamificationStore();

  // Expose seek function to parent via ref
  useEffect(() => {
    if (onSeekRef) {
      onSeekRef.current = (seconds: number) => {
        const el = videoRef.current;
        if (el) el.currentTime = seconds;
      };
    }
  }, [onSeekRef]);

  // ─── Progress tracking ──────────────────────────────────
  const progressMutation = useMutation({
    mutationFn: (data: { watchedPercent: number; watchedSeconds: number }) =>
      apiPatch(`/lessons/${lesson.id}/progress`, { ...data, courseId }),
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      apiPost(`/lessons/${lesson.id}/complete`, { courseId }),
    onSuccess: (data: any) => {
      setCompletedLocally(true);
      setShowCompleteAnim(true);
      setTimeout(() => setShowCompleteAnim(false), 3000);

      // Optimistic XP/coin award
      awardXpLocal(10);
      awardCoinsLocal(5);

      // XP burst at top-right of player
      addXpBurst(10, window.innerWidth - 80, 80);

      toast.success('Aula concluída! +10 XP +5 moedas', { icon: '⚡' });
      qc.invalidateQueries({ queryKey: ['enrollment', courseId] });
      onComplete();

      // Auto-advance after 1s
      if (lessonIndex < allLessons.length - 1) {
        setTimeout(onNext, 1000);
      }
    },
    onError: () => toast.error('Erro ao registrar conclusão'),
  });

  // ─── Video event handlers ────────────────────────────────
  const handleTimeUpdate = useCallback(
    (e: any) => {
      const video = e.target as HTMLVideoElement;
      if (!video.duration) return;
      const pct = (video.currentTime / video.duration) * 100;
      setWatchedPercent(pct);
      setWatchedSeconds(video.currentTime);
      onTimeUpdate?.(video.currentTime);

      // Throttle progress saves (every 10 seconds)
      if (Math.floor(video.currentTime) % 10 === 0) {
        progressMutation.mutate({ watchedPercent: pct, watchedSeconds: video.currentTime });
      }

      // Auto-complete at 90%
      if (pct >= 90 && !completedLocally) {
        completeMutation.mutate();
      }
    },
    [completedLocally],
  );

  const isFirst = lessonIndex === 0;
  const isLast = lessonIndex === allLessons.length - 1;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-dim">
        <a href={`/courses/${courseId}`} className="hover:text-text-secondary transition-colors">{courseTitle}</a>
        <span>/</span>
        <span className="text-text-secondary">{lesson.moduleTitle}</span>
        <span>/</span>
        <span className="text-text-primary font-medium">{lesson.title}</span>
      </div>

      {/* Player Stage */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-border">
        {lesson.type === 'VIDEO' && lesson.muxPlaybackId ? (
          <MuxPlayer
            playbackId={lesson.muxPlaybackId}
            metadata={{ video_title: lesson.title, viewer_user_id: courseId }}
            onTimeUpdate={handleTimeUpdate}
            style={{ width: '100%', height: '100%' }}
            streamType="on-demand"
            accentColor="#7c5cff"
          />
        ) : lesson.type === 'VIDEO' && lesson.videoUrl ? (
          <video
            ref={(el) => { videoRef.current = el; }}
            src={lesson.videoUrl}
            controls
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
              {lesson.type === 'DOCUMENT' ? (
                <FileText size={36} className="text-neon-cyan" />
              ) : (
                <BookOpen size={36} className="text-neon-purple" />
              )}
            </div>
            <p className="text-text-secondary font-medium">{lesson.title}</p>
            <p className="text-text-muted text-sm">
              {lesson.type === 'DOCUMENT' ? 'Documento / Leitura' : 'Conteúdo interativo'}
            </p>
          </div>
        )}

        {/* Completion Overlay */}
        <AnimatePresence>
          {showCompleteAnim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-20 h-20 rounded-full bg-neon-mint/20 border-2 border-neon-mint flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-neon-mint" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-display font-bold text-white">Aula concluída!</p>
                  <p className="text-neon-mint text-sm font-semibold mt-1">+10 XP · +5 moedas</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document/Content rendering */}
      {lesson.type === 'DOCUMENT' && lesson.content && (
        <div className="card prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )}

      {/* Lesson Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-purple text-xs font-bold uppercase tracking-wider">
              {lesson.type === 'VIDEO' ? 'Videoaula' : lesson.type === 'DOCUMENT' ? 'Documento' : lesson.type}
            </span>
            {completedLocally && (
              <span className="badge-mint text-xs">
                <CheckCircle2 size={11} /> Concluída
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-text-dim">
              <Clock size={12} />
              <span>{Math.round(lesson.duration / 60)} min</span>
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-text-primary">{lesson.title}</h1>
        </div>
      </div>

      {/* Progress Bar */}
      {lesson.type === 'VIDEO' && (
        <div>
          <div className="flex justify-between text-xs text-text-dim mb-1.5">
            <span>Progresso da aula</span>
            <span>{Math.round(watchedPercent)}%</span>
          </div>
          <div className="progress-bar h-2">
            <div
              className={cn('progress-fill h-full transition-all duration-300', completedLocally && 'bg-neon-mint')}
              style={{ width: `${Math.max(watchedPercent, completedLocally ? 100 : 0)}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPrev}
          disabled={isFirst}
          className="btn btn-secondary gap-2 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
          Anterior
        </motion.button>

        {!completedLocally ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="btn btn-primary flex-1 gap-2 py-3"
          >
            <Zap size={16} className="fill-white" />
            Concluir aula (+10 XP · +5 moedas)
          </motion.button>
        ) : (
          <div className="flex-1 btn btn-ghost text-neon-mint border-neon-mint/20 gap-2 cursor-default">
            <CheckCircle2 size={16} />
            Aula concluída
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          disabled={isLast}
          className="btn btn-secondary gap-2 disabled:opacity-30"
        >
          Próxima
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}
