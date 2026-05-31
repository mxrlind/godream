'use client';

import { useState } from 'react';
import { Search, Flame, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useGamificationStore } from '@/store/gamification.store';
import { useRouter } from 'next/navigation';
import { NotificationsBell } from '@/features/notifications/NotificationsBell';

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const { streak, coins, xp, level } = useGamificationStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/courses?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="h-16 bg-surface-1 border-b border-border flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cursos, aulas, professores..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-text placeholder:text-text-dim focus:border-neon-purple/50 focus:outline-none focus:ring-1 focus:ring-neon-purple/20 transition-all"
          />
        </div>
      </form>

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-4">
        {/* Stats */}
        <div className="hidden sm:flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="chip-streak text-sm"
            title="Streak"
          >
            <Flame size={14} className="fill-orange-400" />
            <span>{streak}</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="chip-coins text-sm"
            title="Moedas"
          >
            <span className="text-xs font-bold">₿</span>
            <span>{coins.toLocaleString('pt-BR')}</span>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="chip-xp text-sm"
            title="XP"
          >
            <Zap size={13} className="fill-neon-purple" />
            <span>{xp.toLocaleString('pt-BR')}</span>
          </motion.div>
        </div>

        {/* Notifications */}
        <NotificationsBell />

        {/* User Avatar */}
        <Link href="/profile">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2.5 cursor-pointer pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface-2 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: user?.avatarColor || 'linear-gradient(135deg, #7c5cff, #00e5ff)' }}
            >
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                : user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-none">{user?.name}</p>
              <p className="text-[10px] text-text-dim mt-0.5">Lv {level} · #{42}</p>
            </div>
          </motion.div>
        </Link>
      </div>
    </header>
  );
}
