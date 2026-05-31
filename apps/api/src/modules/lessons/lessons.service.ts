import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';
import { CreateLessonDto, UpdateProgressDto } from './dto/create-lesson.dto';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class LessonsService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    private readonly gamification: GamificationService,
  ) {}

  async create(dto: CreateLessonDto) {
    const module = await this.db.module.findUnique({ where: { id: dto.moduleId } });
    if (!module) throw new NotFoundException('Módulo não encontrado');

    const lesson = await this.db.lesson.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        description: dto.description,
        type: dto.type,
        order: dto.order,
        duration: dto.duration ?? 0,
        isFree: dto.isFree ?? false,
        muxPlaybackId: dto.muxPlaybackId,
        videoUrl: dto.videoUrl,
        fileUrl: dto.fileUrl,
        content: dto.content,
      },
    });

    // Update course totalLessons
    const count = await this.db.lesson.count({ where: { module: { courseId: module.courseId } } });
    await this.db.course.update({ where: { id: module.courseId }, data: { totalLessons: count } });

    return lesson;
  }

  async findById(id: string) {
    const lesson = await this.db.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Aula não encontrada');
    return lesson;
  }

  async update(id: string, data: Partial<CreateLessonDto>) {
    return this.db.lesson.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.db.lesson.delete({ where: { id } });
  }

  async saveProgress(userId: string, lessonId: string, dto: UpdateProgressDto) {
    const lesson = await this.findById(lessonId);
    const completed = dto.watchedPercent >= 90;

    const progress = await this.db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        watchedPercent: dto.watchedPercent,
        watchedSeconds: dto.watchedSeconds,
        completed: completed || undefined,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        userId, lessonId,
        watchedPercent: dto.watchedPercent,
        watchedSeconds: dto.watchedSeconds,
        completed,
        completedAt: completed ? new Date() : undefined,
      },
    });

    return { progress, completed };
  }

  async completeLesson(userId: string, lessonId: string, courseId: string) {
    const lesson = await this.findById(lessonId);

    // Check if already completed
    const existing = await this.db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    if (existing?.completed) {
      return { alreadyCompleted: true, lesson };
    }

    // Mark completed
    await this.db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { completed: true, completedAt: new Date(), watchedPercent: 100 },
      create: { userId, lessonId, completed: true, completedAt: new Date(), watchedPercent: 100, watchedSeconds: lesson.duration },
    });

    // Recalculate enrollment progress
    await this.recalculateEnrollment(userId, courseId);

    // Award XP/coins via gamification
    await this.gamification.onLessonCompleted(userId, lessonId, courseId);

    // Tick study streak (separate from login streak)
    await this.gamification.tickStreak(userId);

    // Check if course is now 100% complete
    const enrollment = await this.db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (enrollment?.progress === 100 && !enrollment.completedAt) {
      await this.gamification.onCourseCompleted(userId, courseId);
    }

    return { completed: true, lesson };
  }

  private async recalculateEnrollment(userId: string, courseId: string) {
    const [totalLessons, completedLessons] = await Promise.all([
      this.db.lesson.count({ where: { module: { courseId }, isPublished: true } }),
      this.db.lessonProgress.count({ where: { userId, completed: true, lesson: { module: { courseId } } } }),
    ]);

    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const lastLesson = await this.db.lessonProgress.findFirst({
      where: { userId, lesson: { module: { courseId } } },
      orderBy: { updatedAt: 'desc' },
      select: { lessonId: true },
    });

    await this.db.enrollment.updateMany({
      where: { userId, courseId },
      data: {
        progress,
        completedLessons,
        lastLessonId: lastLesson?.lessonId,
        completedAt: progress >= 100 ? new Date() : undefined,
      },
    });

    return progress;
  }

  async getUserProgress(userId: string, lessonId: string) {
    return this.db.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }

  // ─── Lesson Comments ──────────────────────────────────────

  async getLessonComments(lessonId: string, userId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.db.lessonComment.findMany({
        where: { lessonId, parentId: null, isDeleted: false },
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
        include: {
          author: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
          likes: userId ? { where: { userId }, select: { id: true } } : false,
          replies: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
              likes: userId ? { where: { userId }, select: { id: true } } : false,
            },
          },
        },
      }),
      this.db.lessonComment.count({ where: { lessonId, parentId: null, isDeleted: false } }),
    ]);

    return {
      data: comments.map((c) => ({
        ...c,
        liked: userId ? (c.likes as any[]).length > 0 : false,
        likes: undefined,
        replies: c.replies.map((r) => ({
          ...r,
          liked: userId ? (r.likes as any[]).length > 0 : false,
          likes: undefined,
        })),
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async createLessonComment(
    userId: string,
    lessonId: string,
    body: string,
    parentId?: string,
    timestamp?: number,
  ) {
    const comment = await this.db.lessonComment.create({
      data: { lessonId, authorId: userId, body, parentId: parentId ?? null, timestamp: timestamp ?? null },
      include: {
        author: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
      },
    });

    // Award XP for engagement
    await this.gamification.awardXp({ userId, amount: 2, reason: 'lesson_comment', metadata: { lessonId } });

    return { ...comment, liked: false, replies: [] };
  }

  async likeComment(userId: string, commentId: string) {
    const existing = await this.db.lessonCommentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      await Promise.all([
        this.db.lessonCommentLike.delete({ where: { userId_commentId: { userId, commentId } } }),
        this.db.lessonComment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return { liked: false };
    } else {
      await Promise.all([
        this.db.lessonCommentLike.create({ data: { userId, commentId } }),
        this.db.lessonComment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } }),
      ]);
      return { liked: true };
    }
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.db.lessonComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.authorId !== userId) throw new ForbiddenException('Acesso negado');
    return this.db.lessonComment.update({
      where: { id: commentId },
      data: { isDeleted: true, body: '[comentário removido]' },
    });
  }

  async pinComment(userId: string, commentId: string) {
    const comment = await this.db.lessonComment.findUnique({
      where: { id: commentId },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    const creatorId = comment.lesson.module.course.creatorId;
    if (creatorId !== userId) throw new ForbiddenException('Apenas o criador pode fixar comentários');

    return this.db.lessonComment.update({
      where: { id: commentId },
      data: { isPinned: !comment.isPinned },
    });
  }
}
