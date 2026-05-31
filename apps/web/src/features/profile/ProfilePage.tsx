'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Save, Camera, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { apiGet, apiPatch, api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useGamificationStore } from '@/store/gamification.store';
import { LevelOrb } from '@/features/gamification/LevelOrb';
import { levelColor } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const qc = useQueryClient();
  const { user, setAuth, accessToken, refreshToken, updateUser } = useAuthStore();
  const { xp, level, streak, coins } = useGamificationStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { data } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => apiGet<any>(`/users/${user?.id}/profile`),
    enabled: !!user?.id,
  });

  const profile = (data as any)?.data;

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => apiPatch('/users/me', values),
    onSuccess: (res: any) => {
      if (user) {
        const updated = (res as any)?.data ?? res;
        setAuth({ ...user, ...updated }, accessToken!, refreshToken!);
      }
      toast.success('Perfil atualizado!');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: () => toast.error('Erro ao atualizar perfil'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl = res.data?.data?.avatarUrl ?? res.data?.avatarUrl;
      if (avatarUrl && user) {
        updateUser({ avatarUrl });
        toast.success('Foto atualizada!', { icon: '📸' });
        qc.invalidateQueries({ queryKey: ['profile'] });
      }
    } catch {
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const color = levelColor(level);

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
          <User size={24} className="text-neon-cyan" />
          Meu Perfil
        </h1>
      </motion.div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card p-6 flex items-start gap-6"
        style={{ borderColor: `${color}20` }}
      >
        <div className="relative flex-shrink-0">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black overflow-hidden"
            style={{
              background: `${user?.avatarColor}20`,
              border: `3px solid ${user?.avatarColor}50`,
              color: user?.avatarColor,
            }}
          >
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : user?.name.charAt(0).toUpperCase()
            }
          </div>
          {/* Upload overlay */}
          <motion.button
            whileHover={{ opacity: 1 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ border: `3px solid ${user?.avatarColor}50` }}
          >
            {isUploadingAvatar
              ? <Loader2 size={20} className="animate-spin text-white" />
              : <Camera size={20} className="text-white" />
            }
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <div className="absolute -bottom-3 -right-3">
            <LevelOrb level={level} xp={xp} size="sm" showProgress={false} />
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-display font-bold text-text-primary">{user?.name}</h2>
          <p className="text-text-muted text-sm">@{user?.username}</p>
          {user?.bio && <p className="text-text-secondary text-sm mt-2 leading-relaxed">{user.bio}</p>}

          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-neon-orange font-bold">
              🔥 {streak}d
            </div>
            <div className="flex items-center gap-1" style={{ color }}>
              <span className="font-bold">Lv.{level}</span>
              <span className="text-text-muted text-xs">({xp.toLocaleString()} XP)</span>
            </div>
            <div className="flex items-center gap-1 text-neon-gold font-bold">
              🪙 {coins.toLocaleString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit((v) => updateMutation.mutate(v))}
        className="card p-6 space-y-4"
      >
        <h3 className="font-semibold text-text-primary">Editar informações</h3>

        <div>
          <label className="label">Nome</label>
          <input {...register('name')} className="input w-full" placeholder="Seu nome" />
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea
            {...register('bio')}
            className="input w-full resize-none"
            rows={3}
            placeholder="Conte um pouco sobre você..."
          />
        </div>

        <div className="flex justify-end">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={updateMutation.isPending || !isDirty}
            className="btn btn-primary gap-2 disabled:opacity-50"
          >
            <Save size={15} />
            Salvar alterações
          </motion.button>
        </div>
      </motion.form>

      {/* Stats overview */}
      {profile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card p-5 grid grid-cols-3 gap-4"
        >
          {[
            { label: 'Aulas concluídas', value: profile.gamification?.lessonsCompleted ?? 0 },
            { label: 'Cursos completos', value: profile.gamification?.coursesCompleted ?? 0 },
            { label: 'Minutos estudados', value: profile.gamification?.minutesStudied ?? 0 },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl font-display font-black text-text-primary">{s.value.toLocaleString()}</div>
              <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
