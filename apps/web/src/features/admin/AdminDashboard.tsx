'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, Shield, DollarSign, CheckCircle2, XCircle,
  AlertTriangle, BarChart2, Clock, Search,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { StatTile } from '@/components/ui/StatTile';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'users' | 'courses' | 'creators';

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const qc = useQueryClient();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiGet<any>('/admin/stats'),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', userSearch],
    queryFn: () => apiGet<any>(`/admin/users?search=${userSearch}&limit=20`),
    enabled: tab === 'users',
  });

  const { data: pendingCoursesData } = useQuery({
    queryKey: ['admin', 'courses', 'pending'],
    queryFn: () => apiGet<any>('/admin/courses/pending'),
    enabled: tab === 'courses',
  });

  const { data: pendingCreatorsData } = useQuery({
    queryKey: ['admin', 'creators', 'pending'],
    queryFn: () => apiGet<any>('/admin/creators/pending'),
    enabled: tab === 'creators',
  });

  const stats = (statsData as any)?.data;
  const users = (usersData as any)?.data?.data ?? [];
  const pendingCourses = (pendingCoursesData as any)?.data ?? [];
  const pendingCreators = (pendingCreatorsData as any)?.data ?? [];

  const approveCourse = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/courses/${id}/approve`, {}),
    onSuccess: () => { toast.success('Curso aprovado!'); qc.invalidateQueries({ queryKey: ['admin', 'courses'] }); },
  });

  const rejectCourse = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/courses/${id}/reject`, { reason: 'Não atende os critérios' }),
    onSuccess: () => { toast.success('Curso rejeitado'); qc.invalidateQueries({ queryKey: ['admin', 'courses'] }); },
  });

  const approveCreator = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/users/${id}/approve-creator`, {}),
    onSuccess: () => { toast.success('Creator aprovado!'); qc.invalidateQueries({ queryKey: ['admin', 'creators'] }); },
  });

  const banUser = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/users/${id}/ban`, { reason: 'Violação de termos' }),
    onSuccess: () => { toast.success('Usuário banido'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });

  const TABS = [
    { key: 'overview', label: 'Visão Geral', icon: BarChart2 },
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'courses', label: 'Cursos', icon: BookOpen },
    { key: 'creators', label: 'Creators', icon: Shield },
  ] as const;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
          <Shield size={24} className="text-neon-magenta" />
          Painel Admin
        </h1>
        <p className="text-text-dim text-sm mt-0.5">Gerenciamento e moderação da plataforma</p>
      </motion.div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-surface-3 rounded-xl p-1 border border-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                : 'text-text-dim hover:text-text-secondary',
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
            ) : (
              <>
                <StatTile label="Total de Usuários" value={stats?.users?.toLocaleString() ?? '—'} icon={<Users size={18} />} color="cyan" />
                <StatTile label="Cursos Publicados" value={stats?.courses ?? '—'} icon={<BookOpen size={18} />} color="purple" />
                <StatTile label="Matrículas" value={stats?.enrollments?.toLocaleString() ?? '—'} icon={<CheckCircle2 size={18} />} color="mint" />
                <StatTile label="Receita (Total)" value={`R$ ${(stats?.revenue ?? 0).toFixed(0)}`} icon={<DollarSign size={18} />} color="gold" />
              </>
            )}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar usuário..."
              className="input pl-9 w-full"
            />
          </div>
          {usersLoading ? (
            <Skeleton className="h-60 rounded-xl" />
          ) : (
            <div className="card overflow-hidden divide-y divide-border">
              {users.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">{u.name}</span>
                      {u.isBanned && <span className="badge-red text-[10px]">Banido</span>}
                      {u.role === 'CREATOR' && <span className="badge-purple text-[10px]">Creator</span>}
                      {u.role === 'ADMIN' && <span className="badge-gold text-[10px]">Admin</span>}
                    </div>
                    <p className="text-xs text-text-muted">{u.email} · @{u.username}</p>
                  </div>
                  <div className="text-xs text-text-muted">{u._count?.enrollments ?? 0} matrículas</div>
                  {!u.isBanned && u.role !== 'ADMIN' && (
                    <button
                      onClick={() => banUser.mutate(u.id)}
                      className="btn btn-danger btn-sm text-xs px-3"
                    >
                      Banir
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Courses */}
      {tab === 'courses' && (
        <div className="space-y-2">
          <p className="text-sm text-text-dim">{pendingCourses.length} cursos aguardando revisão</p>
          {pendingCourses.map((course: any) => (
            <div key={course.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold text-text-primary text-sm">{course.title}</div>
                <div className="text-xs text-text-muted">por {course.creator?.name}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveCourse.mutate(course.id)} className="btn btn-sm bg-neon-mint/15 text-neon-mint border border-neon-mint/30 gap-1">
                  <CheckCircle2 size={13} /> Aprovar
                </button>
                <button onClick={() => rejectCourse.mutate(course.id)} className="btn btn-danger btn-sm gap-1">
                  <XCircle size={13} /> Rejeitar
                </button>
              </div>
            </div>
          ))}
          {pendingCourses.length === 0 && (
            <div className="card p-8 text-center text-text-muted">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-neon-mint" />
              Nenhum curso aguardando revisão
            </div>
          )}
        </div>
      )}

      {/* Creators */}
      {tab === 'creators' && (
        <div className="space-y-2">
          <p className="text-sm text-text-dim">{pendingCreators.length} creators aguardando aprovação</p>
          {pendingCreators.map((creator: any) => (
            <div key={creator.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold text-text-primary text-sm">{creator.name}</div>
                <div className="text-xs text-text-muted">{creator.email} · {creator._count?.courses ?? 0} cursos</div>
              </div>
              <button onClick={() => approveCreator.mutate(creator.id)} className="btn btn-sm bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 gap-1">
                <CheckCircle2 size={13} /> Aprovar
              </button>
            </div>
          ))}
          {pendingCreators.length === 0 && (
            <div className="card p-8 text-center text-text-muted">
              <Shield size={32} className="mx-auto mb-2 text-neon-cyan" />
              Nenhum creator aguardando aprovação
            </div>
          )}
        </div>
      )}
    </div>
  );
}
