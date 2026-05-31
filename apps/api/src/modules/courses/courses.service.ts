import {
  Injectable, Inject, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaClient, CourseStatus, CourseLevel } from '@godream/database';
import slugify from 'slugify';
import { DATABASE_SERVICE } from '../../common/database/database.module';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SearchCoursesDto } from './dto/search-courses.dto';

@Injectable()
export class CoursesService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
  ) {}

  // ─── Create Course ────────────────────────────────────────
  async create(creatorId: string, dto: CreateCourseDto) {
    const slug = await this.generateUniqueSlug(dto.title);

    return this.db.course.create({
      data: {
        creatorId,
        title: dto.title,
        slug,
        description: dto.description,
        shortDesc: dto.shortDesc,
        categoryId: dto.categoryId,
        level: (dto.level as CourseLevel) || CourseLevel.BEGINNER,
        status: CourseStatus.DRAFT,
        abbr: dto.abbr.toUpperCase().slice(0, 3),
        accentColor: dto.accentColor || '#7c5cff',
        price: dto.price ? dto.price : null,
        isFree: dto.isFree ?? true,
        tags: dto.tags || [],
        requirements: dto.requirements || [],
        whatYouLearn: dto.whatYouLearn || [],
        language: dto.language || 'pt-BR',
      },
      include: { creator: { select: { id: true, name: true, avatarUrl: true } }, category: true },
    });
  }

  // ─── Update Course ────────────────────────────────────────
  async update(courseId: string, creatorId: string, dto: UpdateCourseDto) {
    await this.ensureCreatorOwns(courseId, creatorId);

    const data: any = { ...dto };
    if (dto.title) data.slug = await this.generateUniqueSlug(dto.title, courseId);
    if (dto.abbr) data.abbr = dto.abbr.toUpperCase().slice(0, 3);

    return this.db.course.update({
      where: { id: courseId },
      data,
      include: { creator: { select: { id: true, name: true, avatarUrl: true } }, category: true, modules: { include: { lessons: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    });
  }

  // ─── Publish Course ───────────────────────────────────────
  async publish(courseId: string, creatorId: string) {
    const course = await this.ensureCreatorOwns(courseId, creatorId);

    if (!course.title || !course.description) {
      throw new ForbiddenException('Preencha título e descrição antes de publicar');
    }

    const totalLessons = await this.db.lesson.count({
      where: { module: { courseId } },
    });

    if (totalLessons === 0) {
      throw new ForbiddenException('Adicione pelo menos uma aula antes de publicar');
    }

    return this.db.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  // ─── Get All (public) ─────────────────────────────────────
  async findAll(dto: SearchCoursesDto, userId?: string) {
    const where: any = {
      status: CourseStatus.PUBLISHED,
    };

    const searchTerm = dto.search || dto.query;
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm } },
      ];
    }

    if (dto.categoryId) where.categoryId = dto.categoryId;
    if (dto.level) where.level = dto.level;
    if (dto.isFree !== undefined) where.isFree = dto.isFree;

    if (dto.maxPrice) {
      where.OR = [...(where.OR || []), { price: { lte: dto.maxPrice } }, { isFree: true }];
    }

    const [courses, total] = await Promise.all([
      this.db.course.findMany({
        where,
        take: dto.limit || 20,
        skip: ((dto.page || 1) - 1) * (dto.limit || 20),
        orderBy: this.getSortOrder(dto.sort),
        include: {
          creator: { select: { id: true, name: true, avatarUrl: true, avatarColor: true } },
          category: true,
          _count: { select: { enrollments: true } },
        },
      }),
      this.db.course.count({ where }),
    ]);

    // Attach user enrollment if logged in
    let enrolledIds = new Set<string>();
    if (userId) {
      const enrollments = await this.db.enrollment.findMany({
        where: { userId, courseId: { in: courses.map((c) => c.id) } },
        select: { courseId: true },
      });
      enrolledIds = new Set(enrollments.map((e) => e.courseId));
    }

    return {
      data: courses.map((c) => ({ ...c, isEnrolled: enrolledIds.has(c.id) })),
      meta: {
        total,
        page: dto.page || 1,
        limit: dto.limit || 20,
        pages: Math.ceil(total / (dto.limit || 20)),
      },
    };
  }

  // ─── Get Single ───────────────────────────────────────────
  async findOne(slugOrId: string, userId?: string) {
    const course = await this.db.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        status: CourseStatus.PUBLISHED,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true, avatarColor: true, bio: true } },
        category: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true, title: true, type: true, order: true,
                duration: true, isFree: true, isPublished: true,
                muxPlaybackId: true,
              },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });

    if (!course) throw new NotFoundException('Curso não encontrado');

    let enrollment = null;
    if (userId) {
      enrollment = await this.db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });
    }

    return { ...course, enrollment };
  }

  // ─── Editor: full course for creator (all statuses) ──────────
  async findOneForEditor(courseId: string, creatorId: string) {
    const course = await this.db.course.findFirst({
      where: { id: courseId, creatorId },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true, avatarColor: true } },
        category: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { enrollments: true, reviews: true } },
      },
    });
    if (!course) throw new NotFoundException('Curso não encontrado');
    return course;
  }

  // ─── Creator Courses ──────────────────────────────────────
  async findByCreator(creatorId: string) {
    return this.db.course.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: { select: { enrollments: true, reviews: true, modules: true } },
        modules: {
          include: { _count: { select: { lessons: true } } },
        },
      },
    });
  }

  // ─── Enroll ───────────────────────────────────────────────
  async enroll(userId: string, courseId: string) {
    const course = await this.db.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');

    const existing = await this.db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ConflictException('Você já está matriculado neste curso');

    if (!course.isFree) {
      const paid = await this.db.paymentOrder.findFirst({
        where: { userId, courseId, status: 'PAID' },
      });
      if (!paid) throw new ForbiddenException('Este curso requer pagamento');
    }

    const [enrollment] = await Promise.all([
      this.db.enrollment.create({ data: { userId, courseId } }),
      this.db.course.update({ where: { id: courseId }, data: { enrolledCount: { increment: 1 } } }),
    ]);

    return enrollment;
  }

  // ─── Update Lesson Progress ───────────────────────────────
  async updateProgress(userId: string, courseId: string, lessonId: string, watchedPercent: number, watchedSeconds: number) {
    const completed = watchedPercent >= 90;

    const progress = await this.db.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {
        watchedPercent: Math.max(watchedPercent, 0),
        watchedSeconds: Math.max(watchedSeconds, 0),
        completed: completed ? true : undefined,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        userId, lessonId,
        watchedPercent, watchedSeconds,
        completed,
        completedAt: completed ? new Date() : undefined,
      },
    });

    // Update enrollment progress
    await this.recalculateEnrollmentProgress(userId, courseId);

    return progress;
  }

  private async recalculateEnrollmentProgress(userId: string, courseId: string) {
    const [totalLessons, completedLessons] = await Promise.all([
      this.db.lesson.count({ where: { module: { courseId }, isPublished: true } }),
      this.db.lessonProgress.count({
        where: { userId, completed: true, lesson: { module: { courseId } } },
      }),
    ]);

    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
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

    return { progress, completedLessons, isCompleted: progress >= 100 };
  }

  // ─── My Courses (student) ────────────────────────────────
  async getMyEnrollments(userId: string) {
    return this.db.enrollment.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        course: {
          include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            category: true,
            _count: { select: { modules: true } },
          },
        },
      },
    });
  }

  // ─── Get Enrollment ──────────────────────────────────────
  async getEnrollment(userId: string, courseId: string) {
    const enrollment = await this.db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return enrollment;
  }

  // ─── Create Review ────────────────────────────────────────
  async createReview(userId: string, courseId: string, rating: number, comment?: string) {
    const existing = await this.db.courseReview.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return this.db.courseReview.update({
        where: { userId_courseId: { userId, courseId } },
        data: { rating, comment },
      });
    }
    const review = await this.db.courseReview.create({
      data: { userId, courseId, rating, comment },
    });
    // Update course avg rating
    const avg = await this.db.courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: true,
    });
    await this.db.course.update({
      where: { id: courseId },
      data: { avgRating: avg._avg.rating ?? 0, ratingCount: avg._count },
    });
    return review;
  }

  // ─── Creator Courses Alias ────────────────────────────────
  async getCreatorCourses(creatorId: string) {
    return this.findByCreator(creatorId);
  }

  // ─── Module CRUD ──────────────────────────────────────────
  async createModule(courseId: string, creatorId: string, data: { title: string; description?: string; order?: number }) {
    await this.ensureCreatorOwns(courseId, creatorId);
    const maxOrder = await this.db.module.aggregate({ where: { courseId }, _max: { order: true } });
    return this.db.module.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        order: data.order ?? (maxOrder._max.order ?? 0) + 1,
      },
      include: { lessons: { orderBy: { order: 'asc' } } },
    });
  }

  async updateModule(courseId: string, moduleId: string, creatorId: string, data: any) {
    await this.ensureCreatorOwns(courseId, creatorId);
    return this.db.module.update({
      where: { id: moduleId },
      data,
      include: { lessons: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteModule(courseId: string, moduleId: string, creatorId: string) {
    await this.ensureCreatorOwns(courseId, creatorId);
    return this.db.module.delete({ where: { id: moduleId } });
  }

  // ─── Delete ───────────────────────────────────────────────
  async remove(courseId: string, creatorId: string) {
    await this.ensureCreatorOwns(courseId, creatorId);
    return this.db.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.ARCHIVED },
    });
  }

  // ─── Categories ───────────────────────────────────────────
  async getCategories() {
    return this.db.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────
  private async ensureCreatorOwns(courseId: string, creatorId: string) {
    const course = await this.db.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Curso não encontrado');
    if (course.creatorId !== creatorId) throw new ForbiddenException('Acesso negado');
    return course;
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = slugify(title, { lower: true, strict: true, locale: 'pt' });
    let attempt = 0;
    while (true) {
      const candidate = attempt > 0 ? `${slug}-${attempt}` : slug;
      const existing = await this.db.course.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) return candidate;
      attempt++;
    }
  }

  private getSortOrder(sort?: string) {
    const sorts: Record<string, any> = {
      newest: { createdAt: 'desc' },
      popular: { enrolledCount: 'desc' },
      rating: { avgRating: 'desc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
    };
    return sorts[sort || 'popular'];
  }
}
