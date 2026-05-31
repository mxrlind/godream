import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface GamificationState {
  xp: number;
  level: number;
  totalXp: number;
  coins: number;
  streak: number;
  longestStreak: number;
  rank: number;
  weeklyXp: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  coursesCompleted: number;
  minutesStudied: number;
  badges: string[];
  shopOwned: string[];
  missionsClaimed: string[];
  bpTier: number;
  bpHasPremium: boolean;
  pendingXpBursts: Array<{ id: string; amount: number; x: number; y: number }>;
}

interface GamificationActions {
  syncState: (data: Partial<GamificationState>) => void;
  addXpBurst: (amount: number, x: number, y: number) => void;
  removeXpBurst: (id: string) => void;
  awardXpLocal: (amount: number) => void;
  awardCoinsLocal: (amount: number) => void;
  markBadgeUnlocked: (badgeId: string) => void;
  markShopItemOwned: (itemId: string) => void;
  claimMissionLocal: (missionId: string) => void;
  setBpTier: (tier: number) => void;
  setBpPremium: (has: boolean) => void;
}

export const useGamificationStore = create<GamificationState & GamificationActions>()(
  immer((set) => ({
    xp: 0, level: 1, totalXp: 0, coins: 100,
    streak: 0, longestStreak: 0, rank: 9999,
    weeklyXp: 0, lessonsCompleted: 0, quizzesCompleted: 0,
    coursesCompleted: 0, minutesStudied: 0,
    badges: [], shopOwned: [], missionsClaimed: [],
    bpTier: 0, bpHasPremium: false,
    pendingXpBursts: [],

    syncState: (data) => set((s) => { Object.assign(s, data); }),

    addXpBurst: (amount, x, y) =>
      set((s) => {
        s.pendingXpBursts.push({ id: Math.random().toString(36).slice(2), amount, x, y });
      }),

    removeXpBurst: (id) =>
      set((s) => { s.pendingXpBursts = s.pendingXpBursts.filter((b) => b.id !== id); }),

    awardXpLocal: (amount) =>
      set((s) => {
        s.xp += amount;
        s.totalXp += amount;
        s.weeklyXp += amount;
        const xpNeeded = Math.floor(100 * Math.pow(s.level, 1.6));
        while (s.xp >= xpNeeded) { s.xp -= xpNeeded; s.level++; }
      }),

    awardCoinsLocal: (amount) => set((s) => { s.coins += amount; }),
    markBadgeUnlocked: (id) => set((s) => { if (!s.badges.includes(id)) s.badges.push(id); }),
    markShopItemOwned: (id) => set((s) => { if (!s.shopOwned.includes(id)) s.shopOwned.push(id); }),
    claimMissionLocal: (id) => set((s) => { if (!s.missionsClaimed.includes(id)) s.missionsClaimed.push(id); }),
    setBpTier: (tier) => set((s) => { s.bpTier = tier; }),
    setBpPremium: (has) => set((s) => { s.bpHasPremium = has; }),
  })),
);
