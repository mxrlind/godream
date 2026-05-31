'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useGamificationStore } from '@/store/gamification.store';
import { rarityColor, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { ShopItem } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  avatar: 'Avatar',
  frame: 'Moldura',
  theme: 'Tema',
  pet: 'Pet',
  boost: 'Boost',
  title: 'Título',
};

const ITEM_ICONS: Record<string, string> = {
  avatar: '🎭',
  frame: '🖼️',
  theme: '🎨',
  pet: '🐾',
  boost: '⚡',
  title: '👑',
};

export function ShopPage() {
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();
  const coins = useGamificationStore((s) => s.coins);
  const { awardCoinsLocal } = useGamificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ['shop'],
    queryFn: () => apiGet<any>('/gamification/shop'),
  });

  const items: ShopItem[] = (data as any)?.data ?? [];

  const buyMutation = useMutation({
    mutationFn: (itemId: string) => apiPost(`/gamification/shop/${itemId}/buy`, {}),
    onSuccess: (res: any, itemId) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        awardCoinsLocal(-item.price);
        toast.success(`${item.name} adquirido!`, { icon: '🎉' });
      }
      qc.invalidateQueries({ queryKey: ['shop'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro na compra'),
  });

  const types = ['', ...Array.from(new Set(items.map((i) => i.type)))];
  const filtered = filter ? items.filter((i) => i.type === filter) : items;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <ShoppingBag size={24} className="text-neon-cyan" />
            Loja
          </h1>
          <p className="text-text-dim text-sm mt-1">Gaste suas moedas em itens exclusivos</p>
        </div>
        <div className="chip-coins flex items-center gap-1.5 px-4 py-2 rounded-xl">
          <span className="text-sm">🪙</span>
          <span className="font-bold text-sm">{coins.toLocaleString()}</span>
        </div>
      </motion.div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
              filter === t
                ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan'
                : 'bg-surface-3 border-border text-text-dim hover:text-text-secondary',
            )}
          >
            {t ? `${ITEM_ICONS[t] || '🔷'} ${TYPE_LABELS[t] || t}` : 'Todos'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } }, hidden: {} }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filtered.map((item, i) => (
            <ShopItemCard key={item.id} item={item} canAfford={coins >= item.price} onBuy={() => buyMutation.mutate(item.id)} index={i} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ShopItemCard({ item, canAfford, onBuy, index }: { item: ShopItem; canAfford: boolean; onBuy: () => void; index: number }) {
  const color = rarityColor(item.rarity);
  const icon = ITEM_ICONS[item.type] || '🔷';

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3 }}
      className="card p-4 flex flex-col gap-3 text-center"
      style={{ borderColor: `${color}20` }}
    >
      <div
        className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl"
        style={{
          background: `${color}10`,
          border: `2px solid ${color}25`,
          boxShadow: `0 0 16px ${color}15`,
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-text-primary leading-tight">{item.name}</p>
        {item.description && <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{item.description}</p>}
        <div
          className="inline-block text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full mt-1.5"
          style={{ background: `${color}15`, color }}
        >
          {item.rarity}
        </div>
      </div>
      <motion.button
        whileHover={canAfford ? { scale: 1.04 } : {}}
        whileTap={canAfford ? { scale: 0.96 } : {}}
        onClick={onBuy}
        disabled={!canAfford}
        className={cn(
          'w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all',
          canAfford
            ? 'bg-neon-gold/15 border-neon-gold/30 text-neon-gold hover:bg-neon-gold/25'
            : 'bg-surface-3 border-border text-text-muted cursor-not-allowed',
        )}
      >
        🪙 {item.price.toLocaleString()}
      </motion.button>
    </motion.div>
  );
}
