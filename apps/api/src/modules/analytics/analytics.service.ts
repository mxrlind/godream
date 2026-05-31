import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
  ) {}

  async getCreatorAnalytics(creatorId: string) {
    const courses = await this.db.course.findMany({
      where: { creatorId },
      select: {
        id: true,
        title: true,
        enrolledCount: true,
        avgRating: true,
        ratingCount: true,
        totalLessons: true,
        _count: { select: { enrollments: true, reviews: true } },
        enrollments: {
          take: 1,
          orderBy: { enrolledAt: 'desc' },
          select: { enrolledAt: true },
        },
      },
    });

    const revenue = await this.db.paymentOrder.groupBy({
      by: ['courseId'],
      where: { course: { creatorId }, status: 'PAID' },
      _sum: { amount: true },
      _count: true,
    });

    const revenueMap = new Map(revenue.map((r) => [r.courseId, r]));

    const totalStudents = courses.reduce((acc, c) => acc + c.enrolledCount, 0);
    const totalRevenue = revenue.reduce((acc, r) => acc + Number(r._sum.amount ?? 0), 0);

    return {
      summary: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue,
        avgRating:
          courses.length > 0
            ? courses.reduce((a, c) => a + c.avgRating, 0) / courses.length
            : 0,
      },
      courses: courses.map((c) => ({
        ...c,
        revenue: Number(revenueMap.get(c.id)?._sum?.amount ?? 0),
        sales: revenueMap.get(c.id)?._count ?? 0,
      })),
    };
  }

  async getCourseAnalytics(creatorId: string, courseId: string, days = 30) {
    const course = await this.db.course.findFirst({
      where: { id: courseId, creatorId },
      include: {
        _count: { select: { enrollments: true, reviews: true } },
        modules: {
          include: { _count: { select: { lessons: true } } },
        },
      },
    });
    if (!course) throw new Error('Curso não encontrado');

    // Enrollments over last N days grouped by day
    const since30 = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const enrollments = await this.db.enrollment.findMany({
      where: { courseId, enrolledAt: { gte: since30 } },
      select: { enrolledAt: true },
      orderBy: { enrolledAt: 'asc' },
    });

    // Group by date
    const enrollByDay: Record<string, number> = {};
    enrollments.forEach((e) => {
      const d = e.enrolledAt.toISOString().split('T')[0];
      enrollByDay[d] = (enrollByDay[d] || 0) + 1;
    });

    // Revenue
    const revenueData = await this.db.paymentOrder.aggregate({
      where: { courseId, status: 'PAID' },
      _sum: { amount: true, creatorEarning: true },
      _count: true,
    });

    // Completion rate
    const [totalEnrolled, completedCount] = await Promise.all([
      this.db.enrollment.count({ where: { courseId } }),
      this.db.enrollment.count({ where: { courseId, completedAt: { not: null } } }),
    ]);

    // Avg progress
    const avgProgress = await this.db.enrollment.aggregate({
      where: { courseId },
      _avg: { progress: true },
    });

    // Lesson completion rates
    const lessons = await this.db.lesson.findMany({
      where: { module: { courseId }, isPublished: true },
      select: {
        id: true, title: true, order: true,
        _count: { select: { progress: true } },
      },
      orderBy: { order: 'asc' },
    });

    // Reviews distribution
    const reviewStats = await this.db.courseReview.groupBy({
      by: ['rating'],
      where: { courseId },
      _count: true,
    });

    return {
      course: {
        id: course.id,
        title: course.title,
        abbr: course.abbr,
        accentColor: course.accentColor,
        status: course.status,
        avgRating: course.avgRating,
        ratingCount: course.ratingCount,
        enrolledCount: course.enrolledCount,
      },
      revenue: {
        total: revenueData._sum.amount ?? 0,
        creatorEarning: revenueData._sum.creatorEarning ?? 0,
        sales: revenueData._count,
      },
      completionRate: totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0,
      avgProgress: avgProgress._avg.progress ?? 0,
      chartDays: days,
      enrollmentChart: Object.entries(enrollByDay).map(([date, count]) => ({ date, count })),
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.order,
        completions: l._count.progress,
        completionRate: totalEnrolled > 0 ? (l._count.progress / totalEnrolled) * 100 : 0,
      })),
      reviewDistribution: reviewStats.reduce<Record<number, number>>((acc, r) => {
        acc[r.rating] = r._count;
        return acc;
      }, {}),
    };
  }

  async getPlatformMetrics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [newUsers, newEnrollments, revenue] = await Promise.all([
      this.db.user.count({ where: { createdAt: { gte: since } } }),
      this.db.enrollment.count({ where: { enrolledAt: { gte: since } } }),
      this.db.paymentOrder.aggregate({
        where: { status: 'PAID', paidAt: { gte: since } },
        _sum: { amount: true },
      }),
    ]);

    return {
      newUsers,
      newEnrollments,
      revenue: revenue._sum.amount ?? 0,
      period: `${days}d`,
    };
  }
}
