import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class QuizzesService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    private readonly gamification: GamificationService,
  ) {}

  // ─── Get quiz for lesson ───────────────────────────────────
  async getQuizByLesson(lessonId: string) {
    const quiz = await this.db.quiz.findFirst({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz não encontrado');
    // Hide isCorrect from students
    return {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options.map(({ isCorrect: _, ...o }) => o),
      })),
    };
  }

  // ─── Submit quiz answers ───────────────────────────────────
  async submitQuiz(
    userId: string,
    quizId: string,
    answers: Array<{ questionId: string; optionId?: string; textAnswer?: string }>,
    timeTaken = 0,
  ) {
    const quiz = await this.db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { include: { options: true } },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz não encontrado');

    let earnedPoints = 0;
    let totalPoints = 0;
    const results: any[] = [];

    for (const answer of answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      totalPoints += question.points;
      let isCorrect = false;

      if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        const correctOption = question.options.find((o) => o.isCorrect);
        isCorrect = answer.optionId === correctOption?.id;
      }

      if (isCorrect) earnedPoints += question.points;
      results.push({
        questionId: answer.questionId,
        isCorrect,
        correctOptionId: question.options.find((o) => o.isCorrect)?.id,
        explanation: question.explanation,
      });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= (quiz.passingScore ?? 70);

    const submission = await this.db.quizSubmission.create({
      data: {
        userId,
        quizId,
        score,
        totalPoints,
        earnedPoints,
        passed,
        timeTaken,
      },
    });

    if (passed) {
      const { xpReward, coinReward } = await this.gamification.onQuizCompleted(
        userId, quizId, earnedPoints, totalPoints,
      );

      await this.db.quizSubmission.update({
        where: { id: submission.id },
        data: { xpEarned: xpReward, coinsEarned: coinReward },
      });
    }

    return { submission, score, earnedPoints, totalPoints, results, passed };
  }

  // ─── Get user submission ───────────────────────────────────
  async getUserSubmission(userId: string, quizId: string) {
    return this.db.quizSubmission.findFirst({
      where: { userId, quizId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  // ─── Creator: create quiz ──────────────────────────────────
  async createQuiz(lessonId: string, data: {
    title: string;
    description?: string;
    passingScore?: number;
    timeLimit?: number;
    questions?: Array<{
      question: string;
      type: string;
      order: number;
      points?: number;
      explanation?: string;
      options?: Array<{ text: string; isCorrect: boolean; order: number }>;
    }>;
  }) {
    return this.db.quiz.create({
      data: {
        lessonId,
        title: data.title,
        description: data.description,
        passingScore: data.passingScore ?? 70,
        timeLimit: data.timeLimit,
        questions: data.questions
          ? {
              create: data.questions.map((q) => ({
                question: q.question,
                type: q.type as any,
                order: q.order,
                points: q.points ?? 1,
                explanation: q.explanation,
                options: q.options
                  ? { create: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order })) }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: { questions: { include: { options: true } } },
    });
  }
}
