import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m}min`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('pt-BR');
}

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

export function levelColor(level: number): string {
  if (level < 5) return '#34f5c5';
  if (level < 10) return '#00e5ff';
  if (level < 20) return '#7c5cff';
  if (level < 30) return '#ff3df0';
  return '#ffd166';
}

export function rarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: '#9ca3af',
    rare: '#00e5ff',
    epic: '#a78bfa',
    legend: '#ffd166',
  };
  return colors[rarity] || colors.common;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function truncate(str: string, max = 80): string {
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.6));
}

export function levelProgress(xp: number, level: number): number {
  return Math.min(100, Math.round((xp / xpForLevel(level)) * 100));
}

/** Short relative time for notifications: "agora", "2min", "3h", "5d" */
export function timeAgo(dateStr: string): string {
  return formatRelativeTime(dateStr);
}
