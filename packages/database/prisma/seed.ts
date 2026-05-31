import { PrismaClient, Role, CourseLevel, CourseStatus, LessonType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GoDream database...');

  // ─── Categories ─────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'programming' }, update: {}, create: { slug: 'programming', name: 'Programação', iconKey: 'code', color: '#7c5cff', order: 1 } }),
    prisma.category.upsert({ where: { slug: 'frontend' }, update: {}, create: { slug: 'frontend', name: 'Frontend', iconKey: 'monitor', color: '#00e5ff', order: 2 } }),
    prisma.category.upsert({ where: { slug: 'ai-data' }, update: {}, create: { slug: 'ai-data', name: 'IA & Dados', iconKey: 'brain', color: '#a78bfa', order: 3 } }),
    prisma.category.upsert({ where: { slug: 'design' }, update: {}, create: { slug: 'design', name: 'Design', iconKey: 'palette', color: '#ff3df0', order: 4 } }),
    prisma.category.upsert({ where: { slug: 'languages' }, update: {}, create: { slug: 'languages', name: 'Idiomas', iconKey: 'globe', color: '#34f5c5', order: 5 } }),
    prisma.category.upsert({ where: { slug: 'concursos' }, update: {}, create: { slug: 'concursos', name: 'Concursos', iconKey: 'award', color: '#ff7a18', order: 6 } }),
  ]);

  // ─── Admin User ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@GoDream2026!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@godream.io' },
    update: {},
    create: {
      email: 'admin@godream.io',
      username: 'godream_admin',
      name: 'GoDream Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isVerified: true,
      isCreator: true,
      creatorApproved: true,
    },
  });

  // ─── Demo Creator ────────────────────────────────────────────
  const creatorPassword = await bcrypt.hash('Creator@Demo123!', 12);
  const creator = await prisma.user.upsert({
    where: { email: 'lucas@godream.io' },
    update: {},
    create: {
      email: 'lucas@godream.io',
      username: 'lucas_mendes',
      name: 'Lucas Mendes',
      passwordHash: creatorPassword,
      role: Role.CREATOR,
      isVerified: true,
      isCreator: true,
      creatorApproved: true,
      avatarColor: '#7c5cff',
    },
  });

  // ─── Demo Student ────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student@Demo123!', 12);
  const student = await prisma.user.upsert({
    where: { email: 'neocoder@godream.io' },
    update: {},
    create: {
      email: 'neocoder@godream.io',
      username: 'neocoder',
      name: 'NeoCoder',
      passwordHash: studentPassword,
      role: Role.STUDENT,
      isVerified: true,
      avatarColor: '#7c5cff',
    },
  });

  // ─── Gamification records ────────────────────────────────────
  await prisma.gamification.upsert({
    where: { userId: student.id },
    update: {},
    create: { userId: student.id, xp: 1240, level: 8, totalXp: 3840, coins: 350, streak: 12, longestStreak: 18 },
  });

  await prisma.gamification.upsert({
    where: { userId: creator.id },
    update: {},
    create: { userId: creator.id, xp: 4200, level: 18, totalXp: 18420, coins: 1200, streak: 30, longestStreak: 45 },
  });

  // ─── Badges ──────────────────────────────────────────────────
  const badgeDefs = [
    { slug: 'first-step',    name: 'Primeiro passo',  description: 'Completou a primeira aula',  iconKey: 'sprout',   style: 'mint', rarity: 'common', condition: { type: 'lessons', threshold: 1 } },
    { slug: 'streak-3',      name: 'Streak de 3',     description: '3 dias seguidos',            iconKey: 'flame',    style: 'fire', rarity: 'common', condition: { type: 'streak', threshold: 3 } },
    { slug: 'streak-7',      name: 'Streak de 7',     description: 'Uma semana sem parar',       iconKey: 'bolt',     style: 'fire', rarity: 'rare', condition: { type: 'streak', threshold: 7 } },
    { slug: 'streak-30',     name: 'Streak de 30',    description: 'Um mês de dedicação!',       iconKey: 'flame',    style: 'fire', rarity: 'epic', condition: { type: 'streak', threshold: 30 } },
    { slug: 'quiz-master',   name: 'Quiz Master',     description: '5 quizzes completos',        iconKey: 'brain',    style: '', rarity: 'rare', condition: { type: 'quizzes', threshold: 5 } },
    { slug: 'level-5',       name: 'Nível 5',         description: 'Atingiu o nível 5',          iconKey: 'star',     style: 'gold', rarity: 'common', condition: { type: 'level', threshold: 5 } },
    { slug: 'level-10',      name: 'Nível 10',        description: 'Aprendiz dedicado',          iconKey: 'trophy',   style: 'gold', rarity: 'rare', condition: { type: 'level', threshold: 10 } },
    { slug: 'level-25',      name: 'Nível 25',        description: 'Mestre do conhecimento',     iconKey: 'crown',    style: 'gold', rarity: 'epic', condition: { type: 'level', threshold: 25 } },
    { slug: 'marathoner',    name: 'Maratonista',     description: '10 aulas completas',         iconKey: 'run',      style: '', rarity: 'common', condition: { type: 'lessons', threshold: 10 } },
    { slug: 'top-10',        name: 'Top 10',          description: 'Entrou no top 10 do rank',   iconKey: 'crown',    style: 'gold', rarity: 'epic', condition: { type: 'rank', threshold: 10 } },
    { slug: 'collector',     name: 'Colecionador',    description: 'Comprou item na loja',       iconKey: 'gem',      style: '', rarity: 'common', condition: { type: 'shop', threshold: 1 } },
    { slug: 'graduate',      name: 'Estudioso',       description: 'Concluiu um curso inteiro',  iconKey: 'graduate', style: 'gold', rarity: 'rare', condition: { type: 'courses', threshold: 1 } },
    { slug: 'triple-course', name: 'Triatleta',       description: 'Concluiu 3 cursos',          iconKey: 'trophy',   style: 'gold', rarity: 'epic', condition: { type: 'courses', threshold: 3 } },
    { slug: 'secret-night',  name: '🌙 Coruja',       description: 'Estudou depois da meia-noite', iconKey: 'star', style: '', rarity: 'epic', isSecret: true, condition: { type: 'night_study', threshold: 1 } },
  ];

  for (const b of badgeDefs) {
    await prisma.badge.upsert({
      where: { slug: b.slug },
      update: {},
      create: { ...b, condition: b.condition as any, isSecret: (b as any).isSecret ?? false },
    });
  }

  // ─── Missions ────────────────────────────────────────────────
  const missionDefs = [
    { slug: 'daily-lessons', title: 'Assistir 2 aulas', description: 'Complete 2 aulas hoje', goalType: 'lessons', goalValue: 2, xpReward: 40, coinReward: 10, order: 1 },
    { slug: 'daily-quiz',    title: 'Completar 1 quiz', description: 'Complete um quiz hoje',  goalType: 'quizzes', goalValue: 1, xpReward: 30, coinReward: 7,  order: 2 },
    { slug: 'daily-minutes', title: 'Estudar 15 min',   description: 'Estude por 15 minutos', goalType: 'minutes', goalValue: 15, xpReward: 25, coinReward: 6, order: 3 },
    { slug: 'daily-login',   title: 'Manter streak',    description: 'Faça login diariamente', goalType: 'login',  goalValue: 1, xpReward: 20, coinReward: 5,  order: 4 },
  ];

  for (const m of missionDefs) {
    await prisma.mission.upsert({ where: { slug: m.slug }, update: {}, create: m });
  }

  // ─── Shop Items ──────────────────────────────────────────────
  const shopItems = [
    { slug: 'avatar-neon-wolf', name: 'Avatar Neon Wolf', price: 200, rarity: 'rare',   type: 'avatar', iconKey: 'avatar' },
    { slug: 'avatar-dragon',    name: 'Avatar Dragon',    price: 400, rarity: 'epic',   type: 'avatar', iconKey: 'avatar' },
    { slug: 'avatar-cyber-cat', name: 'Avatar Cyber Cat', price: 150, rarity: 'common', type: 'avatar', iconKey: 'avatar' },
    { slug: 'frame-legendary',  name: 'Moldura Lendária', price: 600, rarity: 'legend', type: 'frame',  iconKey: 'frame'  },
    { slug: 'theme-sunset',     name: 'Tema Sunset',      price: 250, rarity: 'rare',   type: 'theme',  iconKey: 'palette' },
    { slug: 'theme-neon-city',  name: 'Tema Neon City',   price: 350, rarity: 'epic',   type: 'theme',  iconKey: 'palette' },
    { slug: 'pet-robot',        name: 'Pet: Robô Mini',   price: 500, rarity: 'epic',   type: 'pet',    iconKey: 'pet'    },
    { slug: 'boost-streak',     name: 'Streak Shield',    price: 120, rarity: 'common', type: 'boost',  iconKey: 'shield' },
    { slug: 'boost-xp-2x',     name: 'XP Boost 2x (1h)', price: 80,  rarity: 'common', type: 'boost',  iconKey: 'bolt'   },
    { slug: 'title-legendary',  name: 'Título: Lendário', price: 900, rarity: 'legend', type: 'title',  iconKey: 'crown'  },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({ where: { slug: item.slug }, update: {}, create: item });
  }

  // ─── Battle Pass Season ──────────────────────────────────────
  const season = await prisma.battlePassSeason.upsert({
    where: { number: 1 },
    update: { endDate: new Date('2026-12-31'), isActive: true },
    create: {
      name: 'Temporada 1 · Genesis',
      description: 'A primeira temporada do GoDream Battle Pass',
      number: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });

  const bpTiers = [
    { tierNumber: 1,  track: 'FREE' as const, rewardName: '10 moedas', rewardIconKey: 'gem', rewardType: 'coins', rewardValue: { amount: 10 } },
    { tierNumber: 1,  track: 'PREMIUM' as const, rewardName: 'Skin Avatar', rewardIconKey: 'palette', rewardType: 'cosmetic', rewardValue: { item: 'skin-genesis' } },
    { tierNumber: 2,  track: 'FREE' as const, rewardName: 'Boost XP', rewardIconKey: 'bolt', rewardType: 'boost', rewardValue: { multiplier: 1.5, duration: 3600 } },
    { tierNumber: 2,  track: 'PREMIUM' as const, rewardName: 'Moldura Gold', rewardIconKey: 'frame', rewardType: 'cosmetic', rewardValue: {} },
    { tierNumber: 3,  track: 'FREE' as const, rewardName: 'Streak Shield', rewardIconKey: 'shield', rewardType: 'boost', rewardValue: {} },
    { tierNumber: 3,  track: 'PREMIUM' as const, rewardName: 'Pet Dragão', rewardIconKey: 'pet', rewardType: 'cosmetic', rewardValue: {} },
    { tierNumber: 4,  track: 'FREE' as const, rewardName: '25 moedas', rewardIconKey: 'gem', rewardType: 'coins', rewardValue: { amount: 25 } },
    { tierNumber: 4,  track: 'PREMIUM' as const, rewardName: 'Título Épico', rewardIconKey: 'star', rewardType: 'cosmetic', rewardValue: {} },
    { tierNumber: 5,  track: 'FREE' as const, rewardName: 'Loot Box', rewardIconKey: 'gift', rewardType: 'loot_box', rewardValue: {} },
    { tierNumber: 5,  track: 'PREMIUM' as const, rewardName: 'Avatar Lendário', rewardIconKey: 'crown', rewardType: 'cosmetic', rewardValue: {} },
    { tierNumber: 10, track: 'FREE' as const, rewardName: '100 moedas', rewardIconKey: 'gem', rewardType: 'coins', rewardValue: { amount: 100 } },
    { tierNumber: 10, track: 'PREMIUM' as const, rewardName: 'Troféu Final', rewardIconKey: 'trophy', rewardType: 'cosmetic', rewardValue: {} },
  ];

  for (const tier of bpTiers) {
    await prisma.battlePassTier.upsert({
      where: { seasonId_tierNumber_track: { seasonId: season.id, tierNumber: tier.tierNumber, track: tier.track } },
      update: {},
      create: { ...tier, seasonId: season.id, rewardValue: tier.rewardValue as any },
    });
  }

  // ─── Demo Course ─────────────────────────────────────────────
  const course = await prisma.course.upsert({
    where: { slug: 'javascript-moderno' },
    update: {},
    create: {
      creatorId: creator.id,
      title: 'JavaScript Moderno',
      slug: 'javascript-moderno',
      description: 'Aprenda JavaScript do zero ao avançado com projetos reais. ES6+, async/await, módulos e padrões modernos.',
      shortDesc: 'Do zero ao avançado com projetos reais',
      categoryId: categories[0].id,
      level: CourseLevel.BEGINNER,
      status: CourseStatus.PUBLISHED,
      abbr: 'JS',
      accentColor: '#f7df1e',
      thumbGrad: 'linear-gradient(135deg, #1a1200 0%, #2d2000 100%)',
      price: 0,
      isFree: true,
      totalLessons: 12,
      totalModules: 3,
      publishedAt: new Date(),
      tags: ['javascript', 'frontend', 'web', 'es6'],
    },
  });

  const mod1 = await prisma.module.create({
    data: { courseId: course.id, title: 'Fundamentos', order: 0 },
  });

  await prisma.lesson.createMany({
    data: [
      { moduleId: mod1.id, title: 'Introdução ao JS', type: LessonType.VIDEO, order: 0, duration: 342, isFree: true },
      { moduleId: mod1.id, title: 'Variáveis e tipos', type: LessonType.VIDEO, order: 1, duration: 490 },
      { moduleId: mod1.id, title: 'Quiz: variáveis', type: LessonType.QUIZ, order: 2, duration: 180 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('📋 Demo accounts:');
  console.log('  Admin:   admin@godream.io / Admin@GoDream2026!');
  console.log('  Creator: lucas@godream.io / Creator@Demo123!');
  console.log('  Student: neocoder@godream.io / Student@Demo123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
