'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

export function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  const [countdown, setCountdown] = useState(8);

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiGet<any>(`/payments/orders`),
    enabled: !!orderId,
    staleTime: 0,
  });

  const orders = (data as any) ?? [];
  const order = Array.isArray(orders) ? orders.find((o: any) => o.id === orderId) : null;
  const course = order?.course;

  useEffect(() => {
    if (countdown <= 0) {
      if (course?.slug) {
        router.push(`/courses/${course.slug}`);
      } else {
        router.push('/dashboard');
      }
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, course, router]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-10 max-w-md w-full text-center space-y-6"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 rounded-full bg-neon-mint/15 border-2 border-neon-mint/40 flex items-center justify-center mx-auto"
          style={{ boxShadow: '0 0 40px rgba(57,255,20,0.2)' }}
        >
          <CheckCircle2 size={48} className="text-neon-mint" />
        </motion.div>

        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-display font-bold text-text-primary"
          >
            Pagamento aprovado!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary mt-2 text-sm"
          >
            Sua compra foi confirmada. Você já tem acesso ao curso.
          </motion.p>
        </div>

        {/* Course info */}
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
            <Loader2 size={16} className="animate-spin" />
            Carregando pedido...
          </div>
        ) : course ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: `${course.accentColor}10`,
              border: `1px solid ${course.accentColor}25`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg flex-shrink-0"
              style={{ background: `${course.accentColor}25`, color: course.accentColor }}
            >
              {course.abbr}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-text-primary">{course.title}</p>
              <p className="text-xs text-text-dim">Acesso vitalício desbloqueado</p>
            </div>
          </motion.div>
        ) : null}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          {course?.slug && (
            <Link href={`/courses/${course.slug}`} className="btn btn-primary gap-2">
              <BookOpen size={16} />
              Começar curso agora
              <ArrowRight size={16} />
            </Link>
          )}
          <Link href="/dashboard" className="btn btn-ghost text-sm text-text-dim">
            Ir para o dashboard
          </Link>
        </motion.div>

        <p className="text-xs text-text-muted">
          Redirecionando em {countdown}s...
        </p>
      </motion.div>
    </div>
  );
}
