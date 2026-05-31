'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiPost } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useGamificationStore } from '@/store/gamification.store';
import { GoDreamLogo } from '@/components/brand/GoDreamLogo';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  username: z
    .string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e _'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter pelo menos um número'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const syncGamification = useGamificationStore((s) => s.syncState);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterValues) => {
    setIsLoading(true);
    try {
      const res = await apiPost<any>('/auth/register', values);
      setAuth(res.user, res.accessToken, res.refreshToken);
      if (res.gamification) syncGamification(res.gamification);
      toast.success(`Bem-vindo ao GoDream, ${res.user.name}! 🚀`, { duration: 4000 });
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (Array.isArray(msg)) {
        toast.error(msg[0]);
      } else {
        toast.error(msg || 'Erro ao criar conta');
      }
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
      <div className="card p-8 space-y-6 border-border/60">
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
            Crie sua conta e comece a jornada gratuitamente.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                {...register('name')}
                placeholder="Seu nome"
                className={cn('input pl-9', errors.name && 'input-error')}
                autoComplete="name"
              />
            </div>
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
              <input
                {...register('username')}
                placeholder="meu_username"
                className={cn('input pl-7', errors.username && 'input-error')}
                autoComplete="username"
              />
            </div>
            {errors.username && <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                {...register('email')}
                type="email"
                placeholder="voce@email.com"
                className={cn('input pl-9', errors.email && 'input-error')}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Senha</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 chars, 1 maiúscula, 1 número"
                className={cn('input pl-9 pr-12', errors.password && 'input-error')}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
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
                Criando conta...
              </span>
            ) : (
              'Criar conta — é grátis!'
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-text-dim">
          Já tem conta?{' '}
          <a href="/auth/login" className="font-semibold text-neon-cyan hover:underline">
            Fazer login
          </a>
        </p>
      </div>
    </motion.div>
  );
}
