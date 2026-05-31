'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award, Download, ExternalLink, CheckCircle2 } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export function CertificatesPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => apiGet<any>('/certificates/me'),
  });

  const certificates = (data as any)?.data ?? data ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
          <Award size={24} className="text-neon-gold" />
          Meus Certificados
        </h1>
        <p className="text-text-dim text-sm mt-0.5">
          Certificados conquistados pela conclusão de cursos
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : certificates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-16 text-center"
        >
          <Award size={48} className="mx-auto text-text-muted mb-4 opacity-30" />
          <p className="text-text-secondary font-semibold">Nenhum certificado ainda</p>
          <p className="text-text-dim text-sm mt-1">Complete cursos para ganhar certificados</p>
          <Link href="/courses" className="btn btn-primary mt-5 inline-flex gap-2">
            <ExternalLink size={14} />
            Explorar cursos
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {(Array.isArray(certificates) ? certificates : []).map((cert: any, i: number) => (
            <CertificateCard key={cert.id} cert={cert} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertificateCard({ cert, index }: { cert: any; index: number }) {
  const course = cert.course;
  const meta = cert.metadata as any;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card p-5 flex items-center gap-5"
      style={{ borderColor: `${course?.accentColor}25` }}
    >
      {/* Course icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-black text-2xl flex-shrink-0"
        style={{
          background: `${course?.accentColor}20`,
          border: `2px solid ${course?.accentColor}30`,
          color: course?.accentColor,
          boxShadow: `0 0 20px ${course?.accentColor}15`,
        }}
      >
        {course?.abbr}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-text-primary truncate">{course?.title}</p>
          <CheckCircle2 size={14} className="text-neon-mint flex-shrink-0" />
        </div>
        <p className="text-xs text-text-dim">Por {meta?.creatorName || course?.creator?.name}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] font-mono text-text-muted bg-surface-3 px-2 py-0.5 rounded-md border border-border">
            {cert.certificateNumber}
          </span>
          <span className="text-[11px] text-text-muted">
            {new Date(cert.issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href={cert.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-icon"
          title="Verificar certificado"
        >
          <ExternalLink size={15} />
        </motion.a>
        {cert.pdfUrl && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={cert.pdfUrl}
            download
            className="btn btn-primary btn-icon"
            title="Baixar PDF"
          >
            <Download size={15} />
          </motion.a>
        )}
      </div>
    </motion.div>
  );
}
