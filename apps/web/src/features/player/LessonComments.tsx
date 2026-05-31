'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Reply, Pin, Trash2, Send, ChevronDown } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatRelativeTime, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  body: string;
  likeCount: number;
  liked: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  timestamp?: number;
  createdAt: string;
  author: { id: string; name: string; username: string; avatarUrl?: string; avatarColor: string };
  replies: Comment[];
}

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function Avatar({ author, size = 8 }: { author: Comment['author']; size?: number }) {
  const s = `w-${size} h-${size}`;
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}
      style={{ backgroundColor: author.avatarColor + '25', border: `1.5px solid ${author.avatarColor}40`, color: author.avatarColor }}
    >
      {author.avatarUrl
        ? <img src={author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        : author.name.charAt(0).toUpperCase()
      }
    </div>
  );
}

interface CommentCardProps {
  comment: Comment;
  lessonId: string;
  isReply?: boolean;
  onSeek?: (seconds: number) => void;
}

function CommentCard({ comment, lessonId, isReply = false, onSeek }: CommentCardProps) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => apiPost(`/lessons/comments/${comment.id}/like`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lesson-comments', lessonId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/lessons/comments/${comment.id}`),
    onSuccess: () => {
      toast.success('Comentário removido');
      qc.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: () => apiPost(`/lessons/${lessonId}/comments`, { body: replyBody, parentId: comment.id }),
    onSuccess: () => {
      setReplyBody('');
      setShowReplyBox(false);
      setShowReplies(true);
      qc.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
    },
  });

  const isOwn = user?.id === comment.author.id;

  return (
    <div className={cn('flex gap-2.5', isReply && 'ml-8 border-l border-border pl-3')}>
      <Avatar author={comment.author} size={isReply ? 7 : 8} />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {comment.isPinned && (
            <span className="flex items-center gap-1 text-[10px] text-neon-cyan font-bold">
              <Pin size={10} /> Fixado
            </span>
          )}
          <span className="text-sm font-semibold text-text-primary">{comment.author.name}</span>
          {comment.timestamp !== undefined && onSeek && (
            <button
              onClick={() => onSeek(comment.timestamp!)}
              className="text-[11px] text-neon-purple hover:text-neon-purple/80 font-mono font-bold bg-neon-purple/10 px-1.5 py-0.5 rounded transition-colors"
            >
              {formatTimestamp(comment.timestamp)}
            </button>
          )}
          <span className="text-xs text-text-muted">{formatRelativeTime(comment.createdAt)}</span>
        </div>

        {/* Body */}
        <p className={cn(
          'text-sm leading-relaxed mb-2',
          comment.isDeleted ? 'text-text-muted italic' : 'text-text-secondary',
        )}>
          {comment.body}
        </p>

        {/* Actions */}
        {!comment.isDeleted && (
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => user && likeMutation.mutate()}
              className={cn(
                'flex items-center gap-1 text-xs font-semibold transition-colors',
                comment.liked ? 'text-red-400' : 'text-text-muted hover:text-red-400',
              )}
            >
              <Heart size={12} className={cn(comment.liked && 'fill-red-400')} />
              {comment.likeCount > 0 && comment.likeCount}
            </motion.button>

            {!isReply && user && (
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-neon-cyan transition-colors font-semibold"
              >
                <Reply size={12} />
                Responder
              </button>
            )}

            {isOwn && (
              <button
                onClick={() => deleteMutation.mutate()}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}

        {/* Reply box */}
        <AnimatePresence>
          {showReplyBox && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex gap-2"
            >
              <input
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={`Responder a ${comment.author.name}...`}
                className="input flex-1 py-1.5 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && replyBody.trim()) {
                    e.preventDefault();
                    replyMutation.mutate();
                  }
                  if (e.key === 'Escape') setShowReplyBox(false);
                }}
              />
              <button
                onClick={() => replyMutation.mutate()}
                disabled={!replyBody.trim() || replyMutation.isPending}
                className="btn btn-primary btn-sm px-2.5 disabled:opacity-40"
              >
                <Send size={11} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replies toggle */}
        {!isReply && comment.replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="mt-2 flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-cyan/80 font-semibold transition-colors"
          >
            <ChevronDown size={12} className={cn('transition-transform', showReplies && 'rotate-180')} />
            {showReplies ? 'Ocultar' : `Ver ${comment.replies.length} resposta${comment.replies.length > 1 ? 's' : ''}`}
          </button>
        )}

        {/* Replies */}
        <AnimatePresence>
          {showReplies && comment.replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 space-y-3"
            >
              {comment.replies.map((reply) => (
                <CommentCard key={reply.id} comment={reply} lessonId={lessonId} isReply onSeek={onSeek} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface LessonCommentsProps {
  lessonId: string;
  currentTime?: number;
  onSeek?: (seconds: number) => void;
}

export function LessonComments({ lessonId, currentTime, onSeek }: LessonCommentsProps) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState('');
  const [pinTimestamp, setPinTimestamp] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn: ({ pageParam = 1 }) =>
      apiGet<any>(`/lessons/${lessonId}/comments?page=${pageParam}&limit=20`),
    getNextPageParam: (last: any) => {
      const meta = last?.meta;
      return meta && meta.page < meta.pages ? meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const comments: Comment[] = data?.pages.flatMap((p: any) => p.data ?? []) ?? [];
  const total = data?.pages[0]?.meta?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost(`/lessons/${lessonId}/comments`, {
        body,
        timestamp: pinTimestamp && currentTime ? Math.floor(currentTime) : undefined,
      }),
    onSuccess: () => {
      setBody('');
      setPinTimestamp(false);
      qc.invalidateQueries({ queryKey: ['lesson-comments', lessonId] });
    },
    onError: () => toast.error('Erro ao comentar'),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle size={18} className="text-neon-purple" />
        <h3 className="text-base font-display font-bold text-text-primary">
          Comentários
          {total > 0 && <span className="ml-2 text-sm text-text-muted font-normal">({total})</span>}
        </h3>
      </div>

      {/* Composer */}
      {user ? (
        <div className="card p-4 space-y-3">
          <div className="flex gap-2.5">
            <Avatar author={{ ...user, avatarColor: user.avatarColor ?? '#7c5cff' }} />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compartilhe sua dúvida ou opinião sobre essa aula..."
              className="input flex-1 resize-none min-h-[70px] py-2 text-sm"
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey && body.trim()) {
                  e.preventDefault();
                  createMutation.mutate();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentTime !== undefined && currentTime > 0 && (
                <label className="flex items-center gap-1.5 text-xs text-text-dim cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pinTimestamp}
                    onChange={(e) => setPinTimestamp(e.target.checked)}
                    className="accent-neon-purple"
                  />
                  <span>Comentar em <span className="font-mono text-neon-purple font-bold">{formatTimestamp(Math.floor(currentTime))}</span></span>
                </label>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">{body.length}/1000</span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => createMutation.mutate()}
                disabled={!body.trim() || createMutation.isPending}
                className="btn btn-primary btn-sm gap-1.5 disabled:opacity-40"
              >
                <Send size={12} />
                Comentar
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-4 text-center text-sm text-text-dim">
          <a href="/auth/login" className="text-neon-purple hover:underline">Faça login</a> para comentar
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-surface-3 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 bg-surface-3 rounded" />
                <div className="h-4 w-3/4 bg-surface-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle size={32} className="mx-auto text-text-muted mb-2" />
          <p className="text-sm text-text-muted">Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {comments.map((comment, i) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <CommentCard comment={comment} lessonId={lessonId} onSeek={onSeek} />
              </motion.div>
            ))}
          </AnimatePresence>

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="w-full btn btn-secondary btn-sm"
            >
              Carregar mais comentários
            </button>
          )}
        </div>
      )}
    </div>
  );
}
