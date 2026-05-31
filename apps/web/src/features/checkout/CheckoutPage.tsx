'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Shield, CheckCircle2, Tag, AlertCircle,
  Loader2, ArrowLeft, Lock, Zap, Star, Users,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { formatDuration, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Course } from '@/types';

export function CheckoutPage({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['course-checkout', courseId],
    queryFn: () => apiGet<any>(`/courses/${courseId}`),
  });

  const course: Course | undefined = (data as any)?.data ?? data;

  const checkoutMutation = useMutation({
    mutationFn: () =>
      apiPost<{ checkoutUrl: string; orderId: string }>(
        `/payments/checkout/stripe/${courseId}`,
        appliedCoupon ? { couponCode: appliedCoupon } : {},
      ),
    onSuccess: (res: any) => {
      const url = (res as any)?.checkoutUrl ?? res?.data?.checkoutUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Erro ao criar sessão de pagamento');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erro ao processar pagamento';
      toast.error(msg);
    },
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    // Optimistic: just store and show; real validation happens at checkout
    setTimeout(() => {
      setAppliedCoupon(couponCode.trim().toUpperCase());
      setIsApplyingCoupon(false);
      toast.success('Cupom aplicado! Desconto calculado no checkout.', { icon: '🎟️' });
    }, 600);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <AlertCircle size={40} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-secondary font-semibold">Curso não encontrado</p>
        <button onClick={() => router.push('/courses')} className="btn btn-primary mt-4">
          Ver cursos
        </button>
      </div>
    );
  }

  if (course.isFree) {
    router.push(`/courses/${course.slug}`);
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="btn btn-ghost btn-icon"
        >
          <ArrowLeft size={18} />
        </motion.button>
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <Lock size={20} className="text-neon-cyan" />
            Finalizar compra
          </h1>
          <p className="text-text-dim text-sm">Pagamento seguro via Stripe</p>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-[1fr_340px] gap-6">
        {/* Left — Order summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          {/* Course card */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">Resumo do pedido</p>
            <div className="flex gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center font-display font-black text-2xl flex-shrink-0"
                style={{
                  background: `${course.accentColor}20`,
                  border: `2px solid ${course.accentColor}35`,
                  color: course.accentColor,
                  boxShadow: `0 0 20px ${course.accentColor}15`,
                }}
              >
                {course.abbr}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text-primary leading-tight">{course.title}</p>
                <p className="text-xs text-text-dim mt-0.5 line-clamp-2">{course.shortDesc || course.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  {course.avgRating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-neon-gold fill-neon-gold" />
                      {course.avgRating.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {course.enrolledCount?.toLocaleString()} alunos
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={11} />
                    {course.totalLessons ?? 0} aulas
                  </span>
                </div>
              </div>
            </div>

            {/* What you'll get */}
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {[
                'Acesso vitalício ao curso',
                'Certificado de conclusão',
                'Aulas em HD com legendas',
                'Exercícios e projetos práticos',
                'Suporte da comunidade',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-text-secondary">
                  <CheckCircle2 size={13} className="text-neon-mint flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Cupom de desconto</p>
            <AnimatePresence mode="wait">
              {appliedCoupon ? (
                <motion.div
                  key="applied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-neon-mint/10 border border-neon-mint/30"
                >
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-neon-mint" />
                    <span className="font-bold text-neon-mint text-sm">{appliedCoupon}</span>
                    <span className="text-xs text-text-dim">aplicado</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-text-muted hover:text-neon-magenta transition-colors">
                    Remover
                  </button>
                </motion.div>
              ) : (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      placeholder="Código do cupom"
                      className="input flex-1 text-sm uppercase"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isApplyingCoupon}
                      className="btn btn-secondary px-4 text-sm disabled:opacity-50"
                    >
                      {isApplyingCoupon ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                    </motion.button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-neon-magenta mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {couponError}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right — Payment */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Price breakdown */}
          <div className="card p-5 space-y-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Detalhes do valor</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Preço original</span>
                <span>R$ {(course.price ?? 0).toFixed(2).replace('.', ',')}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-neon-mint">
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    Desconto ({appliedCoupon})
                  </span>
                  <span>Aplicado no checkout</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-text-primary">
                <span>Total</span>
                <span className="text-neon-cyan text-lg">
                  R$ {(course.price ?? 0).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="w-full btn btn-primary py-4 text-base font-bold gap-2 relative overflow-hidden"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Pagar com cartão
              </>
            )}
          </motion.button>

          {/* Trust badges */}
          <div className="card p-4 space-y-2">
            {[
              { icon: <Shield size={14} className="text-neon-mint" />, text: 'Pagamento 100% seguro via Stripe' },
              { icon: <Lock size={14} className="text-neon-cyan" />, text: 'Seus dados estão protegidos' },
              { icon: <CheckCircle2 size={14} className="text-neon-purple" />, text: 'Garantia de satisfação de 7 dias' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-dim">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="flex items-center justify-center gap-2 opacity-60">
            {['VISA', 'MC', 'AMEX', 'PIX'].map((m) => (
              <div
                key={m}
                className="px-2.5 py-1 rounded-md bg-surface-3 border border-border text-[10px] font-bold text-text-muted"
              >
                {m}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
