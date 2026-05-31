'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Send, Image as ImageIcon, Users } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { formatRelativeTime, cn } from '@/lib/utils';
import { SkeletonRow } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { FeedPost } from '@/types';

export function CommunityPage() {
  const [postBody, setPostBody] = useState('');
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 1 }) => apiGet<any>(`/social/feed?page=${pageParam}&limit=15`),
    getNextPageParam: (last: any) => {
      const meta = last?.meta;
      if (meta && meta.page < meta.pages) return meta.page + 1;
      return undefined;
    },
    initialPageParam: 1,
  });

  const posts: FeedPost[] = data?.pages.flatMap((p: any) => p.data ?? []) ?? [];

  const createPost = useMutation({
    mutationFn: () => apiPost('/social/posts', { body: postBody }),
    onSuccess: () => {
      setPostBody('');
      toast.success('Post publicado!');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => toast.error('Erro ao publicar'),
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <Users size={22} className="text-neon-magenta" />
        <h1 className="text-2xl font-display font-bold text-text-primary">Comunidade</h1>
      </motion.div>

      {/* Post composer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card p-4 space-y-3">
        <div className="flex gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: user?.avatarColor + '30', border: `2px solid ${user?.avatarColor}50`, color: user?.avatarColor }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <textarea
            value={postBody}
            onChange={(e) => setPostBody(e.target.value)}
            placeholder="Compartilhe seu progresso, dúvida ou conquista..."
            className="input flex-1 resize-none min-h-[80px] py-2.5"
            maxLength={500}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">{postBody.length}/500</span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => createPost.mutate()}
            disabled={!postBody.trim() || createPost.isPending}
            className="btn btn-primary btn-sm gap-2 disabled:opacity-40"
          >
            <Send size={13} />
            Publicar
          </motion.button>
        </div>
      </motion.div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center">
          <MessageCircle size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary font-semibold">Seja o primeiro a publicar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </AnimatePresence>
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="w-full btn btn-secondary text-sm py-2.5"
            >
              Carregar mais
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, index }: { post: FeedPost; index: number }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState('');

  const likeMutation = useMutation({
    mutationFn: () => apiPost(`/social/posts/${post.id}/like`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const commentMutation = useMutation({
    mutationFn: () => apiPost(`/social/posts/${post.id}/comments`, { body: commentBody }),
    onSuccess: () => {
      setCommentBody('');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card p-4 space-y-3"
    >
      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: post.author.avatarColor + '30', border: `2px solid ${post.author.avatarColor}50`, color: post.author.avatarColor }}
        >
          {post.author.avatarUrl
            ? <img src={post.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            : post.author.name.charAt(0).toUpperCase()
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{post.author.name}</p>
          <p className="text-xs text-text-muted">@{post.author.username} · {formatRelativeTime(post.createdAt)}</p>
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{post.body}</p>

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className="w-full rounded-xl max-h-64 object-cover border border-border" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => likeMutation.mutate()}
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold transition-colors',
            post.liked ? 'text-red-400' : 'text-text-dim hover:text-red-400',
          )}
        >
          <Heart size={14} className={cn(post.liked && 'fill-red-400')} />
          {post.likeCount}
        </motion.button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-dim hover:text-neon-cyan transition-colors"
        >
          <MessageCircle size={14} />
          {post.commentCount}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="space-y-2 pt-1">
          {post.comments?.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: c.author.avatarColor + '30', color: c.author.avatarColor }}
              >
                {c.author.name.charAt(0)}
              </div>
              <div className="flex-1 bg-surface-3 rounded-xl px-3 py-2">
                <span className="font-semibold text-text-secondary text-xs">{c.author.name} </span>
                <span className="text-text-dim">{c.body}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Comentar..."
              className="input flex-1 py-1.5 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && commentBody.trim()) {
                  e.preventDefault();
                  commentMutation.mutate();
                }
              }}
            />
            <button
              onClick={() => commentMutation.mutate()}
              disabled={!commentBody.trim()}
              className="btn btn-primary btn-sm px-3 disabled:opacity-40"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
