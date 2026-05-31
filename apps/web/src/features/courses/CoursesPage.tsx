'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { CourseCard } from './CourseCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { Course, ApiResponse } from '@/types';

const LEVELS = [
  { label: 'Todos', value: '' },
  { label: 'Iniciante', value: 'BEGINNER' },
  { label: 'Intermediário', value: 'INTERMEDIATE' },
  { label: 'Avançado', value: 'ADVANCED' },
];

const SORTS = [
  { label: 'Mais novos', value: 'newest' },
  { label: 'Populares', value: 'popular' },
  { label: 'Melhor avaliados', value: 'rating' },
];

export function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [search, setSearch] = useState(initialQ);
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState('newest');
  const [freeOnly, setFreeOnly] = useState(false);

  // Keep search box in sync when URL param changes (e.g. Topbar search)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearch(q);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { search, level, sort, freeOnly }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (level) params.set('level', level);
      if (sort) params.set('sort', sort);
      if (freeOnly) params.set('isFree', 'true');
      params.set('status', 'PUBLISHED');
      return apiGet<ApiResponse<Course[]>>(`/courses?${params.toString()}`);
    },
    placeholderData: (prev) => prev,
  });

  const courses = (data as any)?.data ?? [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Explorar Cursos</h1>
          <p className="text-text-dim text-sm mt-0.5">Encontre seu próximo curso e avance de nível</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-4 space-y-4"
      >
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cursos, tópicos, skills..."
            className="input pl-9 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Level filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal size={14} className="text-text-muted" />
            <div className="flex gap-1">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    level === l.value
                      ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
                      : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input text-xs px-3 py-1.5 h-auto w-auto"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Free toggle */}
          <button
            onClick={() => setFreeOnly(!freeOnly)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              freeOnly
                ? 'bg-neon-mint/15 border-neon-mint/40 text-neon-mint'
                : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
            )}
          >
            Grátis
          </button>
        </div>
      </motion.div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-text-secondary font-semibold">Nenhum curso encontrado</p>
          <p className="text-text-dim text-sm mt-1">Tente outros termos de busca</p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
            hidden: {},
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {courses.map((course: Course) => (
            <motion.div
              key={course.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            >
              <CourseCard
                course={course}
                onClick={() => router.push(`/courses/${course.slug}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
