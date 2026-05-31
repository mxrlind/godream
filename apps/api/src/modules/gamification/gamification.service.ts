import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '../../common/database/database.module';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

interface XpEventData {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    private readonly notifications: NotificationsService,
    @Optional() private readonly gateway: NotificationsGateway,
  ) {}

  // ─── XP Formula ───────────────────────────────────────────
  xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.6));
  }

  // ─── Award XP ─────────────────────────────────────────────
  async awardXp({ userId, amount, reason, metadata }: XpEventData) {
    const gamification = await this.db.gamification.findUnique({ where: { userId } });
    if (!gamification) return null;

    let newXp = gamification.xp + amount;
    let newLevel = gamification.level;
    let leveledUp = false;
    const levelsGained: number[] = [];

    // Handle level ups
    while (newXp >= this.xpForLevel(newLevel)) {
      newXp -= this.xpForLevel(newLevel);
      newLevel++;
      leveledUp = true;
      levelsGained.push(newLevel);
    }

    const updated = await this.db.gamification.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
        totalXp: { increment: amount },
        weeklyXp: { increment: amount },
        monthlyXp: { increment: amount },
        xpEvents: {
          create: { amount, reason, metadata: metadata as any },
        },
      },
    });

    // Emit real-time XP award event
    this.gateway?.sendToUser(userId, 'xp_award', { xp: amount, reason, totalXp: updated.totalXp, level: updated.level });

    if (leveledUp) {
      for (const lvl of levelsGained) {
        // Real-time level-up event
        this.gateway?.sendToUser(userId, 'level_up', { level: lvl, xp: updated.xp });
        await this.notifications.create(userId, {
          type: 'LEVEL_UP',
          title: `Level ${lvl} alcançado!`,
          body: `Parabéns! Você subiu para o nível ${lvl}. Continue evoluindo!`,
          data: { level: lvl },
        });
      }
    }

    // Check badges after XP gain
    await this.checkAndAwardBadges(userId);

    // Advance battle pass tier based on total XP in current season
    await this.advanceBattlePassTier(userId, updated.totalXp);

    return { ...updated, leveledUp, levelsGained };
  }

  // ─── Streak Tick (public — called from auth & lessons) ────
  async tickStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gamification = await this.db.gamification.findUnique({ where: { userId } });
    if (!gamification) return;

    const alreadyToday = await this.db.streakDay.findUnique({
      where: { gamificationId_date: { gamificationId: gamification.id, date: today } },
    });

    if (!alreadyToday) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const hadYesterday = await this.db.streakDay.findUnique({
        where: { gamificationId_date: { gamificationId: gamification.id, date: yesterday } },
      });

      const newStreak = hadYesterday ? gamification.streak + 1 : 1;
      const isNewRecord = newStreak > gamification.longestStreak;

      await Promise.all([
        this.db.streakDay.create({
          data: { gamificationId: gamification.id, date: today },
        }),
        this.db.gamification.update({
          where: { id: gamification.id },
          data: {
            streak: newStreak,
            longestStreak: Math.max(newStreak, gamification.longestStreak),
            lastStreakDate: today,
          },
        }),
      ]);

      // Real-time streak event
      this.gateway?.sendToUser(userId, 'streak_update', { streak: newStreak, isNewRecord });

      // Milestone notifications
      if ([3, 7, 14, 30, 60, 100].includes(newStreak)) {
        await this.notifications.create(userId, {
          type: 'ACHIEVEMENT',
          title: `${newStreak} dias de sequência! 🔥`,
          body: `Incrível! Você manteve sua sequência por ${newStreak} dias consecutivos. Continue assim!`,
          data: { streak: newStreak },
        });
      }

      return { streak: newStreak, isNewRecord };
    }

    return { streak: gamification.streak, isNewRecord: false };
  }

  // ─── Streak History ────────────────────────────────────────
  async getStreakHistory(userId: string, days = 30) {
    const gamification = await this.db.gamification.findUnique({ where: { userId } });
    if (!gamification) return { streak: 0, longestStreak: 0, days: [] };

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const streakDays = await this.db.streakDay.findMany({
      where: { gamificationId: gamification.id, date: { gte: since } },
      select: { date: true, xpEarned: true },
      orderBy: { date: 'asc' },
    });

    return {
      streak: gamification.streak,
      longestStreak: gamification.longestStreak,
      days: streakDays.map((d) => ({
        date: d.date.toISOString().split('T')[0],
        xpEarned: d.xpEarned,
      })),
    };
  }

  // ─── Battle Pass Tier Progression ─────────────────────────
  async advanceBattlePassTier(userId: string, totalXp: number) {
    const season = await this.db.battlePassSeason.findFirst({ where: { isActive: true } });
    if (!season) return;

    const userPass = await this.db.userBattlePass.findUnique({
      where: { userId_seasonId: { userId, seasonId: season.id } },
    });
    if (!userPass) return;

    // Each tier requires 100 XP (configurable per season)
    const XP_PER_TIER = 100;
    const earnedTier = Math.min(Math.floor(totalXp / XP_PER_TIER), 100);

    if (earnedTier > userPass.currentTier) {
      await this.db.userBattlePass.update({
        where: { userId_seasonId: { userId, seasonId: season.id } },
        data: { currentTier: earnedTier },
      });

      this.gateway?.sendToUser(userId, 'battle_pass_tier', { tier: earnedTier });
    }
  }

  // ─── Award Coins ──────────────────────────────────────────
  async awardCoins(userId: string, amount: number, reason?: string) {
    return this.db.gamification.update({
      where: { userId },
      data: { coins: { increment: amount } },
    });
  }

  async spendCoins(userId: string, amount: number): Promise<boolean> {
    const g = await this.db.gamification.findUnique({ where: { userId } });
    if (!g || g.coins < amount) return false;
    await this.db.gamification.update({ where: { userId }, data: { coins: { decrement: amount } } });
    return true;
  }

  // ─── Lesson Completed ─────────────────────────────────────
  async onLessonCompleted(userId: string, lessonId: string, courseId: string) {
    await this.db.gamification.update({
      where: { userId },
      data: { lessonsCompleted: { increment: 1 }, minutesStudied: { increment: 5 } },
    });

    await this.awardXp({ userId, amount: 10, reason: 'lesson_completed', metadata: { lessonId } });
    await this.awardCoins(userId, 5, 'lesson_completed');
    await this.updateMissionProgress(userId, 'lessons', 1);
    await this.updateMissionProgress(userId, 'minutes', 5);
  }

  // ─── Quiz Completed ───────────────────────────────────────
  async onQuizCompleted(userId: string, quizId: string, correct: number, total: number) {
    const isPerfect = correct === total;
    const xpReward = correct * 8 + (isPerfect ? 25 : 0);
    const coinReward = correct * 3;

    await this.db.gamification.update({
      where: { userId },
      data: { quizzesCompleted: { increment: 1 } },
    });

    await this.awardXp({ userId, amount: xpReward, reason: 'quiz_completed', metadata: { quizId, correct, total } });
    await this.awardCoins(userId, coinReward, 'quiz_completed');
    await this.updateMissionProgress(userId, 'quizzes', 1);

    return { xpReward, coinReward, isPerfect };
  }

  // ─── Course Completed ─────────────────────────────────────
  async onCourseCompleted(userId: string, courseId: string) {
    await this.db.gamification.update({
      where: { userId },
      data: { coursesCompleted: { increment: 1 } },
    });

    await this.awardXp({ userId, amount: 100, reason: 'course_completed', metadata: { courseId } });
    await this.awardCoins(userId, 50, 'course_completed');

    await this.notifications.create(userId, {
      type: 'ACHIEVEMENT',
      title: 'Curso concluído!',
      body: `Parabéns por concluir mais um curso. Seu certificado está disponível!`,
      data: { courseId },
    });

    await this.checkAndAwardBadges(userId);
  }

  // ─── Mission Progress ─────────────────────────────────────
  async updateMissionProgress(userId: string, type: string, increment: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const missions = await this.db.mission.findMany({
      where: { goalType: type, isActive: true },
    });

    for (const mission of missions) {
      const alreadyClaimed = await this.db.missionClaim.findUnique({
        where: { userId_missionId_date: { userId, missionId: mission.id, date: today } },
      });
      if (alreadyClaimed) continue;

      // We track progress externally via gamification stats
      const g = await this.db.gamification.findUnique({ where: { userId } });
      if (!g) continue;

      const currentProgress = this.getMissionProgress(g, type);
      if (currentProgress >= mission.goalValue && !alreadyClaimed) {
        // Mission completable — notify to claim
        await this.notifications.create(userId, {
          type: 'MISSION_COMPLETE',
          title: `Missão concluída!`,
          body: `"${mission.title}" — Clique para coletar ${mission.xpReward} XP`,
          data: { missionId: mission.id },
        });
      }
    }
  }

  async claimMission(userId: string, missionId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mission = await this.db.mission.findUnique({ where: { id: missionId } });
    if (!mission) throw new Error('Missão não encontrada');

    const alreadyClaimed = await this.db.missionClaim.findUnique({
      where: { userId_missionId_date: { userId, missionId, date: today } },
    });
    if (alreadyClaimed) throw new Error('Missão já coletada hoje');

    const g = await this.db.gamification.findUnique({ where: { userId } });
    const progress = this.getMissionProgress(g!, mission.goalType);
    if (progress < mission.goalValue) throw new Error('Missão não completada ainda');

    await this.db.missionClaim.create({ data: { userId, missionId, date: today } });
    await this.awardXp({ userId, amount: mission.xpReward, reason: 'mission_claimed', metadata: { missionId } });
    await this.awardCoins(userId, mission.coinReward, 'mission_claimed');

    return { xpReward: mission.xpReward, coinReward: mission.coinReward };
  }

  private getMissionProgress(g: any, type: string): number {
    const map: Record<string, keyof typeof g> = {
      lessons: 'lessonsCompleted',
      quizzes: 'quizzesCompleted',
      minutes: 'minutesStudied',
      login: 'streak',
      streak: 'streak',
    };
    return (g as any)[map[type] || type] || 0;
  }

  // ─── Badge Checking ───────────────────────────────────────
  async checkAndAwardBadges(userId: string) {
    const [g, unlockedIds] = await Promise.all([
      this.db.gamification.findUnique({ where: { userId } }),
      this.db.badgeUnlock.findMany({
        where: { userId },
        select: { badgeId: true },
      }),
    ]);

    if (!g) return;

    const unlockedSet = new Set(unlockedIds.map((b) => b.badgeId));
    const badges = await this.db.badge.findMany({ where: { isSecret: false } });

    const ctx = {
      lessons: g.lessonsCompleted,
      streak: g.streak,
      quizzes: g.quizzesCompleted,
      level: g.level,
      rank: g.rank,
      shop: 0,
      courses: g.coursesCompleted,
    };

    for (const badge of badges) {
      if (unlockedSet.has(badge.id)) continue;
      const condition = badge.condition as any;
      const earned = this.evaluateBadgeCondition(condition, ctx);
      if (earned) {
        await this.db.badgeUnlock.create({ data: { userId, badgeId: badge.id } });
        await this.notifications.create(userId, {
          type: 'ACHIEVEMENT',
          title: `Conquista desbloqueada!`,
          body: `${badge.name} — ${badge.description}`,
          data: { badgeId: badge.id },
        });
      }
    }
  }

  private evaluateBadgeCondition(condition: any, ctx: Record<string, number>): boolean {
    const { type, threshold } = condition;
    if (type === 'rank') return ctx.rank <= threshold;
    return (ctx[type] || 0) >= threshold;
  }

  // ─── Leaderboard ──────────────────────────────────────────
  async getLeaderboard(limit = 50, period: 'weekly' | 'monthly' | 'all') {
    const orderField = period === 'weekly' ? 'weeklyXp' : period === 'monthly' ? 'monthlyXp' : 'totalXp';

    const entries = await this.db.gamification.findMany({
      take: limit,
      orderBy: { [orderField]: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, name: true, avatarUrl: true, avatarColor: true },
        },
      },
    });

    return entries.map((g, i) => ({
      rank: i + 1,
      userId: g.userId,
      user: g.user,
      xp: period === 'weekly' ? g.weeklyXp : period === 'monthly' ? g.monthlyXp : g.totalXp,
      level: g.level,
      streak: g.streak,
    }));
  }

  // ─── Battle Pass ──────────────────────────────────────────
  async getUserBattlePass(userId: string) {
    const season = await this.db.battlePassSeason.findFirst({ where: { isActive: true } });
    if (!season) return null;

    let userPass = await this.db.userBattlePass.findUnique({
      where: { userId_seasonId: { userId, seasonId: season.id } },
    });

    if (!userPass) {
      userPass = await this.db.userBattlePass.create({
        data: { userId, seasonId: season.id },
      });
    }

    const [tiers, claimedIds] = await Promise.all([
      this.db.battlePassTier.findMany({
        where: { seasonId: season.id },
        orderBy: [{ tierNumber: 'asc' }, { track: 'asc' }],
      }),
      this.db.battlePassClaim.findMany({
        where: { userId },
        select: { tierId: true },
      }),
    ]);

    const claimedSet = new Set(claimedIds.map((c) => c.tierId));

    return {
      season,
      userBattlePass: userPass,
      tiers: tiers.map((t) => ({
        ...t,
        claimed: claimedSet.has(t.id),
        canClaim:
          userPass!.currentTier >= t.tierNumber &&
          !claimedSet.has(t.id) &&
          (t.track === 'FREE' || userPass!.hasPremium),
      })),
    };
  }

  async claimBattlePassReward(userId: string, tierId: string) {
    const tier = await this.db.battlePassTier.findUnique({
      where: { id: tierId },
      include: { season: true },
    });
    if (!tier) throw new Error('Tier não encontrado');

    const userPass = await this.db.userBattlePass.findFirst({
      where: { userId, seasonId: tier.seasonId },
    });
    if (!userPass) throw new Error('Battle pass não encontrado');

    if (userPass.currentTier < tier.tierNumber) throw new Error('Tier não alcançado');
    if (tier.track === 'PREMIUM' && !userPass.hasPremium) throw new Error('Requer Battle Pass Premium');

    const already = await this.db.battlePassClaim.findUnique({ where: { userId_tierId: { userId, tierId } } });
    if (already) throw new Error('Recompensa já coletada');

    await this.db.battlePassClaim.create({ data: { userId, tierId } });

    // Grant reward
    const rewardValue = tier.rewardValue as any;
    if (tier.rewardType === 'coins' && rewardValue?.amount) {
      await this.awardCoins(userId, rewardValue.amount, 'battle_pass_claim');
    }

    return { tier, claimed: true };
  }

  async unlockBattlePassPremium(userId: string) {
    const canSpend = await this.spendCoins(userId, 500);
    if (!canSpend) throw new Error('Moedas insuficientes (500)');

    const season = await this.db.battlePassSeason.findFirst({ where: { isActive: true } });
    if (!season) throw new Error('Nenhuma temporada ativa');

    await this.db.userBattlePass.upsert({
      where: { userId_seasonId: { userId, seasonId: season.id } },
      update: { hasPremium: true, premiumPurchasedAt: new Date() },
      create: { userId, seasonId: season.id, hasPremium: true, premiumPurchasedAt: new Date() },
    });
  }

  // ─── Get Stats ────────────────────────────────────────────
  async getStats(userId: string) {
    return this.db.gamification.findUnique({ where: { userId } });
  }

  // ─── Get Missions for User ────────────────────────────────
  async getMissions(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [missions, claims, g] = await Promise.all([
      this.db.mission.findMany({ where: { isActive: true }, orderBy: { xpReward: 'desc' } }),
      this.db.missionClaim.findMany({
        where: { userId, date: { gte: today } },
        select: { missionId: true },
      }),
      this.db.gamification.findUnique({ where: { userId } }),
    ]);

    const claimedSet = new Set(claims.map((c) => c.missionId));

    return missions.map((m) => ({
      ...m,
      progress: g ? this.getMissionProgress(g, m.goalType) : 0,
      completed: g ? this.getMissionProgress(g, m.goalType) >= m.goalValue : false,
      claimed: claimedSet.has(m.id),
    }));
  }

  // ─── Get Badges for User ──────────────────────────────────
  async getBadges(userId: string) {
    const [all, unlocked] = await Promise.all([
      this.db.badge.findMany({ orderBy: { rarity: 'asc' } }),
      this.db.badgeUnlock.findMany({ where: { userId }, select: { badgeId: true, unlockedAt: true } }),
    ]);

    const unlockedMap = new Map(unlocked.map((u) => [u.badgeId, u.unlockedAt]));

    return all.map((b) => ({
      ...b,
      isUnlocked: unlockedMap.has(b.id),
      unlockedAt: unlockedMap.get(b.id) ?? null,
    }));
  }

  // ─── Shop ─────────────────────────────────────────────────
  async getShopItems() {
    return this.db.shopItem.findMany({
      where: { isActive: true },
      orderBy: [{ rarity: 'asc' }, { price: 'asc' }],
    });
  }

  async buyShopItem(userId: string, itemId: string) {
    const item = await this.db.shopItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error('Item não encontrado');
    if (!item.isActive) throw new Error('Item indisponível');

    const spent = await this.spendCoins(userId, item.price);
    if (!spent) throw new Error('Moedas insuficientes');

    const purchase = await this.db.shopPurchase.create({
      data: { userId, itemId, coinsPaid: item.price },
    });

    return { purchase, item };
  }

  // ─── Battle Pass Claim ────────────────────────────────────
  async claimBattlePassTier(userId: string, tierId: string) {
    return this.claimBattlePassReward(userId, tierId);
  }

  // ─── Get Full State ────────────────────────────────────────
  async getUserGamificationState(userId: string) {
    const [g, badges, shopOwned, missionClaims] = await Promise.all([
      this.db.gamification.findUnique({ where: { userId } }),
      this.db.badgeUnlock.findMany({ where: { userId }, include: { badge: true } }),
      this.db.shopPurchase.findMany({ where: { userId }, include: { item: true } }),
      this.db.missionClaim.findMany({
        where: { userId, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        select: { missionId: true },
      }),
    ]);

    return {
      gamification: g,
      badges: badges.map((b) => b.badge),
      shopOwned: shopOwned.map((p) => p.item),
      missionsClaimed: missionClaims.map((c) => c.missionId),
    };
  }
}
