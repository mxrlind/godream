'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, Github, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useGamificationStore } from '@/store/gamification.store';
import { GoDreamLogo } from '@/components/brand/GoDreamLogo';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email ou username obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
});
type LoginValues = z.infer<typeof loginSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const syncGamification = useGamificationStore((s) => s.syncState);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);
    try {
      const res = await apiPost<any>('/auth/login', values);
      setAuth(res.user, res.accessToken, res.refreshToken);
      if (res.gamification) syncGamification(res.gamification);
      toast.success(`Bem-vindo(a), ${res.user.name}! 🚀`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciais inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <div className="card p-8 space-y-7 border-border/60">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            <GoDreamLogo size={36} />
            <span className="font-display font-bold text-3xl">
              <span className="text-neon-cyan">Go</span>
              <span className="text-text-primary">Dream</span>
            </span>
          </div>
          <p className="text-text-dim text-sm">
            Aprenda. Evolua. Conquiste. Sua jornada começa agora.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Email ou Username</label>
            <input
              {...register('identifier')}
              placeholder="voce@email.com ou username"
              className={cn('input', errors.identifier && 'input-error')}
              autoComplete="username"
            />
            {errors.identifier && (
              <p className="text-xs text-red-400 mt-1">{errors.identifier.message}</p>
            )}
          </div>

          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn('input pr-12', errors.password && 'input-error')}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end">
            <a href="/auth/forgot-password" className="text-xs text-text-dim hover:text-neon-cyan transition-colors">
              Esqueci a senha
            </a>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-full py-3 text-sm font-bold"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                  <Zap size={15} />
                </motion.div>
                Entrando...
              </span>
            ) : (
              'Começar Jornada'
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted font-medium">ou continue com</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <OAuthButton
            href={`${API_URL}/api/v1/auth/google`}
            label="Google"
            icon={<span className="font-bold text-sm">G</span>}
          />
          <OAuthButton
            href={`${API_URL}/api/v1/auth/github`}
            label="GitHub"
            icon={<Github size={16} />}
          />
          <OAuthButton
            href={`${API_URL}/api/v1/auth/discord`}
            label="Discord"
            icon={<MessageSquare size={16} />}
          />
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-text-dim">
          Não tem conta?{' '}
          <a href="/auth/register" className="font-semibold text-neon-cyan hover:underline">
            Criar agora — é grátis!
          </a>
        </p>
      </div>
    </motion.div>
  );
}

function OAuthButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.06)' }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center justify-center gap-2 rounded-xl py-2.5 bg-surface-2 border border-border text-text-secondary text-sm font-medium transition-all cursor-pointer"
      title={`Entrar com ${label}`}
    >
      {icon}
      <span className="hidden sm:inline text-xs">{label}</span>
    </motion.a>
  );
}
