'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Award, ExternalLink } from 'lucide-react';
import { apiGet } from '@/lib/api';
import Link from 'next/link';

export function VerifyCertificateClient({ code }: { code: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['verify-cert', code],
    queryFn: () => apiGet<any>(`/certificates/verify/${code}`),
    retry: false,
  });

  const result = (data as any)?.data ?? data;
  const cert = result?.certificate;

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-10 max-w-md w-full text-center space-y-6"
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
            <p className="text-text-muted text-sm">Verificando certificado...</p>
          </div>
        ) : isError || !result?.valid ? (
          <>
            <div className="w-20 h-20 rounded-full bg-neon-magenta/15 border-2 border-neon-magenta/40 flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-neon-magenta" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-text-primary">Certificado não encontrado</h1>
              <p className="text-text-secondary text-sm mt-2">
                O código <code className="font-mono bg-surface-3 px-1.5 py-0.5 rounded text-xs">{code}</code> não corresponde a nenhum certificado válido.
              </p>
            </div>
            <Link href="/" className="btn btn-primary">Ir para GoDream</Link>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-neon-mint/15 border-2 border-neon-mint/40 flex items-center justify-center mx-auto"
              style={{ boxShadow: '0 0 40px rgba(57,255,20,0.2)' }}
            >
              <CheckCircle2 size={40} className="text-neon-mint" />
            </motion.div>

            <div>
              <h1 className="text-xl font-display font-bold text-text-primary">Certificado válido!</h1>
              <p className="text-text-dim text-sm mt-1">Verificado na plataforma GoDream</p>
            </div>

            <div className="card p-5 text-left space-y-3">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Aluno</p>
                <p className="font-bold text-text-primary mt-0.5">{cert.user?.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Curso</p>
                <p className="font-semibold text-text-secondary mt-0.5">{cert.course?.title}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Criador</p>
                <p className="text-text-secondary text-sm mt-0.5">{cert.course?.creator?.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Emitido em</p>
                <p className="text-text-secondary text-sm mt-0.5">
                  {new Date(cert.issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Código</p>
                <p className="font-mono text-sm text-neon-cyan mt-0.5">{cert.certificateNumber}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <Award size={13} className="text-neon-gold" />
              <span>Verificado pela plataforma GoDream</span>
            </div>

            <Link href="/" className="btn btn-ghost text-sm gap-1.5">
              <ExternalLink size={13} />
              Conheça o GoDream
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
