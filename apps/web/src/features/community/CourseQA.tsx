'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, ChevronUp, ChevronDown, CheckCircle2, MessageSquare,
  Plus, X, Send, Award, Pin,
} from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatRelativeTime, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface QAAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  avatarColor: string;
  role: string;
}

interface Answer {
  id: string;
  body: string;
  upvotes: number;
  isAccepted: boolean;
  createdAt: string;
  userVote: number;
  author: QAAuthor;
}

interface Question {
  id: string;
  title: string;
  body: string;
  upvotes: number;
  isAnswered: boolean;
  isPinned: boolean;
  createdAt: string;
  userVote: number;
  answerCount: number;
  author: QAAuthor;
  answers?: Answer[];
}

function VoteButton({ value, active, onClick }: { value: 1 | -1; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onClick}
      className={cn(
        'p-1 rounded transition-colors',
        active
          ? value === 1 ? 'text-neon-mint bg-neon-mint/15' : 'text-red-400 bg-red-400/15'
          : 'text-text-muted hover:text-text-secondary',
      )}
    >
      {value === 1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </motion.button>
  );
}

function AuthorBadge({ author }: { author: QAAuthor }) {
  const isCreator = author.role === 'CREATOR' || author.role === 'ADMIN';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={{ backgroundColor: author.avatarColor + '25', border: `1.5px solid ${author.avatarColor}50`, color: author.avatarColor }}
      >
        {author.avatarUrl
          ? <img src={author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          : author.name.charAt(0).toUpperCase()
        }
      </div>
      <span className="text-xs font-semibold text-text-secondary">{author.name}</span>
      {isCreator && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-gold/15 text-neon-gold font-bold border border-neon-gold/20">
          Instrutor
        </span>
      )}
    </div>
  );
}

function AnswerCard({
  answer, questionId, onAccept, canAccept,
}: {
  answer: Answer;
  questionId: string;
  onAccept: (answerId: string) => void;
  canAccept: boolean;
}) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => apiPost(`/community/answers/${answer.id}/vote`, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qa-question', questionId] }),
  });

  return (
    <div className={cn(
      'rounded-xl border p-4 space-y-3 transition-colors',
      answer.isAccepted
        ? 'bg-neon-mint/5 border-neon-mint/30'
        : 'bg-surface-2 border-border',
    )}>
      {answer.isAccepted && (
        <div className="flex items-center gap-1.5 text-xs text-neon-mint font-bold">
          <CheckCircle2 size={13} />
          Resposta aceita
        </div>
      )}
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{answer.body}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <VoteButton value={1} active={answer.userVote === 1} onClick={() => voteMutation.mutate(1)} />
            <span className="text-xs font-bold text-text-secondary w-6 text-center">{answer.upvotes}</span>
            <VoteButton value={-1} active={answer.userVote === -1} onClick={() => voteMutation.mutate(-1)} />
          </div>
          <AuthorBadge author={answer.author} />
          <span className="text-xs text-text-muted">{formatRelativeTime(answer.createdAt)}</span>
        </div>
        {canAccept && !answer.isAccepted && (
          <button
            onClick={() => onAccept(answer.id)}
            className="text-xs text-text-muted hover:text-neon-mint transition-colors flex items-center gap-1 font-semibold"
          >
            <CheckCircle2 size={12} />
            Aceitar
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionDetail({ question, courseId, onBack }: { question: Question; courseId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [answerBody, setAnswerBody] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['qa-question', question.id],
    queryFn: () => apiGet<any>(`/community/questions/${question.id}`),
  });

  const fullQuestion: Question = (data as any) ?? question;

  const voteMutation = useMutation({
    mutationFn: (value: 1 | -1) => apiPost(`/community/questions/${question.id}/vote`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qa-question', question.id] });
      qc.invalidateQueries({ queryKey: ['course-qa', courseId] });
    },
  });

  const answerMutation = useMutation({
    mutationFn: () => apiPost(`/community/questions/${question.id}/answers`, { body: answerBody }),
    onSuccess: () => {
      setAnswerBody('');
      qc.invalidateQueries({ queryKey: ['qa-question', question.id] });
      qc.invalidateQueries({ queryKey: ['course-qa', courseId] });
      toast.success('Resposta enviada!');
    },
    onError: () => toast.error('Erro ao enviar resposta'),
  });

  const acceptMutation = useMutation({
    mutationFn: (answerId: string) => apiPatch(`/community/answers/${answerId}/accept`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qa-question', question.id] });
      qc.invalidateQueries({ queryKey: ['course-qa', courseId] });
      toast.success('Resposta aceita!');
    },
  });

  const canAccept = user?.id === fullQuestion.author.id;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1 transition-colors"
      >
        ← Voltar às perguntas
      </button>

      {/* Question */}
      <div className="card p-5 space-y-3">
        <div className="flex gap-3">
          {/* Vote */}
          <div className="flex flex-col items-center gap-0.5">
            <VoteButton value={1} active={fullQuestion.userVote === 1} onClick={() => voteMutation.mutate(1)} />
            <span className="text-sm font-bold text-text-secondary">{fullQuestion.upvotes}</span>
            <VoteButton value={-1} active={fullQuestion.userVote === -1} onClick={() => voteMutation.mutate(-1)} />
          </div>
          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2 flex-wrap">
              {fullQuestion.isAnswered && (
                <span className="flex items-center gap-1 text-[11px] text-neon-mint font-bold">
                  <CheckCircle2 size={11} /> Respondida
                </span>
              )}
              <h3 className="text-base font-display font-bold text-text-primary">{fullQuestion.title}</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{fullQuestion.body}</p>
            <div className="flex items-center gap-2 pt-1">
              <AuthorBadge author={fullQuestion.author} />
              <span className="text-xs text-text-muted">{formatRelativeTime(fullQuestion.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-text-secondary flex items-center gap-2">
          <MessageSquare size={14} className="text-neon-cyan" />
          {fullQuestion.answers?.length ?? 0} resposta{(fullQuestion.answers?.length ?? 0) !== 1 ? 's' : ''}
        </h4>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card p-4 animate-pulse space-y-2">
                <div className="h-3 w-3/4 bg-surface-3 rounded" />
                <div className="h-3 w-1/2 bg-surface-3 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {fullQuestion.answers?.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                questionId={question.id}
                onAccept={(id) => acceptMutation.mutate(id)}
                canAccept={canAccept}
              />
            ))}
          </div>
        )}
      </div>

      {/* Answer composer */}
      {user ? (
        <div className="card p-4 space-y-3">
          <h4 className="text-sm font-bold text-text-secondary">Sua resposta</h4>
          <textarea
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            placeholder="Escreva uma resposta detalhada..."
            className="input w-full resize-none min-h-[100px] text-sm py-2.5"
            maxLength={2000}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">{answerBody.length}/2000</span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => answerMutation.mutate()}
              disabled={!answerBody.trim() || answerMutation.isPending}
              className="btn btn-primary btn-sm gap-1.5 disabled:opacity-40"
            >
              <Send size={12} />
              Responder
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="card p-4 text-center text-sm text-text-dim">
          <a href="/auth/login" className="text-neon-purple hover:underline">Faça login</a> para responder
        </div>
      )}
    </div>
  );
}

interface CourseQAProps {
  courseId: string;
}

export function CourseQA({ courseId }: CourseQAProps) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ['course-qa', courseId],
    queryFn: ({ pageParam = 1 }) =>
      apiGet<any>(`/community/courses/${courseId}/questions?page=${pageParam}&limit=15`),
    getNextPageParam: (last: any) => {
      const meta = last?.meta;
      return meta && meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const questions: Question[] = data?.pages.flatMap((p: any) => p.data ?? []) ?? [];
  const total = data?.pages[0]?.meta?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: () => apiPost(`/community/courses/${courseId}/questions`, { title: newTitle, body: newBody }),
    onSuccess: () => {
      setNewTitle('');
      setNewBody('');
      setShowNewForm(false);
      qc.invalidateQueries({ queryKey: ['course-qa', courseId] });
      toast.success('Pergunta enviada!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao enviar pergunta'),
  });

  if (selectedQuestion) {
    return (
      <QuestionDetail
        question={selectedQuestion}
        courseId={courseId}
        onBack={() => setSelectedQuestion(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-neon-cyan" />
          <h3 className="text-base font-display font-bold text-text-primary">
            Perguntas & Respostas
            {total > 0 && <span className="ml-2 text-sm text-text-muted font-normal">({total})</span>}
          </h3>
        </div>
        {user && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewForm(!showNewForm)}
            className="btn btn-primary btn-sm gap-1.5"
          >
            {showNewForm ? <X size={12} /> : <Plus size={12} />}
            {showNewForm ? 'Cancelar' : 'Nova Pergunta'}
          </motion.button>
        )}
      </div>

      {/* New question form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card p-5 space-y-3 border-neon-purple/30"
          >
            <h4 className="text-sm font-bold text-text-primary">Nova Pergunta</h4>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título da sua dúvida..."
              className="input w-full text-sm"
              maxLength={150}
            />
            <textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Descreva sua dúvida com detalhes. Quanto mais contexto, melhor a resposta."
              className="input w-full resize-none min-h-[90px] text-sm py-2.5"
              maxLength={2000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">{newBody.length}/2000</span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => createMutation.mutate()}
                disabled={!newTitle.trim() || !newBody.trim() || createMutation.isPending}
                className="btn btn-primary btn-sm gap-1.5 disabled:opacity-40"
              >
                <Send size={12} />
                Enviar
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse space-y-2">
              <div className="h-4 w-2/3 bg-surface-3 rounded" />
              <div className="h-3 w-full bg-surface-3 rounded" />
              <div className="h-3 w-1/2 bg-surface-3 rounded" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10">
          <HelpCircle size={36} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">Nenhuma pergunta ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, i) => (
            <motion.button
              key={question.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedQuestion(question)}
              className={cn(
                'w-full text-left card p-4 hover:border-neon-purple/40 transition-colors group',
                question.isAnswered && 'border-neon-mint/20',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Votes */}
                <div className="flex flex-col items-center gap-0.5 min-w-[36px]">
                  <ChevronUp size={14} className="text-text-muted group-hover:text-neon-purple transition-colors" />
                  <span className="text-sm font-bold text-text-secondary">{question.upvotes}</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {question.isPinned && <Pin size={11} className="text-neon-cyan" />}
                    {question.isAnswered ? (
                      <span className="flex items-center gap-1 text-[10px] text-neon-mint font-bold shrink-0">
                        <CheckCircle2 size={10} /> Respondida
                      </span>
                    ) : (
                      <span className="text-[10px] text-text-muted font-semibold shrink-0">Sem resposta</span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary group-hover:text-neon-purple transition-colors truncate">
                    {question.title}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{question.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <MessageSquare size={11} />
                      {question.answerCount} resposta{question.answerCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-text-muted">
                      {question.author.name} · {formatRelativeTime(question.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
