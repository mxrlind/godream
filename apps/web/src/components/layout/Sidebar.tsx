'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Target, BarChart2, Award, ShoppingBag,
  Shield, Users, User, LogOut, Edit, Zap, Crown, GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useGamificationStore } from '@/store/gamification.store';
import { GoDreamLogo } from '@/components/brand/GoDreamLogo';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dashboard',   icon: Home },
  { href: '/courses',     label: 'Explorar',    icon: BookOpen },
  { href: '/my-courses',  label: 'Meus Cursos', icon: Zap },
  { href: '/missions',    label: 'Missões',     icon: Target },
  { href: '/rank',        label: 'Ranking',     icon: BarChart2 },
];

const REWARD_ITEMS = [
  { href: '/badges',     label: 'Conquistas',  icon: Award },
  { href: '/shop',       label: 'Loja',        icon: ShoppingBag },
  { href: '/battle-pass',label: 'Battle Pass', icon: Shield },
];

const SOCIAL_ITEMS = [
  { href: '/community',     label: 'Comunidade',    icon: Users },
  { href: '/certificates',  label: 'Certificados',  icon: GraduationCap },
  { href: '/profile',       label: 'Perfil',        icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { level, xp } = useGamificationStore();
  const xpNeeded = Math.floor(100 * Math.pow(level, 1.6));
  const xpPct = Math.min(100, Math.round((xp / xpNeeded) * 100));

  const handleLogout = async () => {
    clearAuth();
    window.location.href = '/auth/login';
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 h-screen bg-surface-1 border-r border-border flex-shrink-0 overflow-y-auto no-scrollbar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <GoDreamLogo size={28} />
        <span className="font-display font-bold text-xl">
          <span className="text-neon-cyan">Go</span>
          <span className="text-text-primary">Dream</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <NavSection label="Menu">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </NavSection>

        <NavSection label="Recompensas">
          {REWARD_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </NavSection>

        <NavSection label="Social">
          {SOCIAL_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </NavSection>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-3">
        {/* Level Progress */}
        <div className="px-2">
          <div className="flex justify-between text-xs text-text-dim mb-1.5">
            <span className="font-semibold">Level {level}</span>
            <span>{xpPct}%</span>
          </div>
          <div className="progress-bar h-1.5">
            <div className="progress-fill h-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        {/* Premium Banner */}
        <div className="bg-gradient-to-r from-neon-purple/15 to-neon-cyan/10 border border-neon-purple/20 rounded-2xl p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={14} className="text-neon-gold" />
            <span className="text-xs font-bold text-text-primary">GoDream Premium</span>
          </div>
          <p className="text-xs text-text-dim mb-2.5">IA ilimitada, cursos exclusivos e sem anúncios.</p>
          <button className="btn btn-primary w-full text-xs py-2">Upgrade</button>
        </div>

        {/* Mode Switch */}
        {(user?.isCreator || user?.role === 'CREATOR') && (
          <Link href="/creator" className="btn btn-ghost w-full text-xs justify-start gap-2">
            <Edit size={14} />
            Modo Criador
          </Link>
        )}

        {/* Logout */}
        <button onClick={handleLogout} className="btn btn-ghost w-full text-xs justify-start gap-2 text-text-dim hover:text-red-400">
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </aside>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-3 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link href={href} className={cn('nav-item relative', active && 'active')}>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-neon-purple rounded-r-full"
        />
      )}
      <Icon size={17} className={cn('flex-shrink-0', active ? 'text-neon-purple' : 'text-text-muted')} />
      <span>{label}</span>
    </Link>
  );
}
