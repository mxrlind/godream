'use client';

import { motion } from 'framer-motion';
import { Star, Users, Clock, CheckCircle2, Lock } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onClick?: () => void;
  compact?: boolean;
}

export function CourseCard({ course, onClick, compact = false }: CourseCardProps) {
  const progress = course.enrollment?.progress ?? 0;
  const isEnrolled = course.isEnrolled ?? !!course.enrollment;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="card overflow-hidden cursor-pointer group"
    >
      {/* Thumbnail */}
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden',
          compact ? 'h-28' : 'h-40',
        )}
        style={{
          background: course.thumbGrad ||
            `linear-gradient(135deg, ${course.accentColor}40 0%, ${course.accentColor}10 100%)`,
        }}
      >
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-1"
            style={{ color: course.accentColor }}
          >
            <span
              className="font-display font-black text-3xl tracking-tight select-none"
              style={{
                textShadow: `0 0 24px ${course.accentColor}80`,
                filter: 'brightness(1.2)',
              }}
            >
              {course.abbr}
            </span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {course.isFree && (
            <span className="badge-mint text-[10px] px-1.5 py-0.5">Grátis</span>
          )}
          {course.level === 'BEGINNER' && (
            <span className="badge-cyan text-[10px] px-1.5 py-0.5">Iniciante</span>
          )}
          {course.level === 'INTERMEDIATE' && (
            <span className="badge-purple text-[10px] px-1.5 py-0.5">Inter.</span>
          )}
          {course.level === 'ADVANCED' && (
            <span className="badge-red text-[10px] px-1.5 py-0.5">Avançado</span>
          )}
        </div>

        {/* Progress bar on enrolled courses */}
        {isEnrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className="h-full bg-neon-mint transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        <h3 className="font-semibold text-sm text-text-primary leading-snug line-clamp-2 group-hover:text-neon-cyan transition-colors">
          {course.title}
        </h3>

        {!compact && (
          <p className="text-xs text-text-dim line-clamp-2">{course.shortDesc || course.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-text-muted">
          {course.avgRating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={11} className="text-neon-gold fill-neon-gold" />
              <span className="font-semibold text-text-secondary">{course.avgRating.toFixed(1)}</span>
              <span>({course.ratingCount})</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users size={11} />
            <span>{course.enrolledCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} />
            <span>{formatDuration(course.totalDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="text-xs text-text-muted">
            por{' '}
            <span className="text-text-secondary font-medium">{course.creator.name}</span>
          </div>
          <div>
            {isEnrolled ? (
              <div className="flex items-center gap-1 text-neon-mint text-xs font-semibold">
                <CheckCircle2 size={12} />
                {progress > 0 ? `${progress}%` : 'Inscrito'}
              </div>
            ) : course.isFree ? (
              <span className="badge-mint text-xs">Grátis</span>
            ) : (
              <span className="font-bold text-sm text-text-primary">
                R$ {course.price?.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
