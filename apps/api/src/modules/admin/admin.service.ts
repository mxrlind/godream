import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
  ) {}

  async getDashboardStats() {
    const [users, courses, enrollments, revenue] = await Promise.all([
      this.db.user.count(),
      this.db.course.count({ where: { status: 'PUBLISHED' } }),
      this.db.enrollment.count(),
      this.db.paymentOrder.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      users,
      courses,
      enrollments,
      revenue: Number(revenue._sum.amount ?? 0),
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, username: true,
          role: true, isVerified: true, isBanned: true,
          isCreator: true, creatorApproved: true, createdAt: true,
          _count: { select: { enrollments: true } },
        },
      }),
      this.db.user.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async banUser(userId: string, reason: string, adminId: string) {
    const [user] = await Promise.all([
      this.db.user.update({ where: { id: userId }, data: { isBanned: true } }),
      this.db.adminAction.create({
        data: { adminId, targetId: userId, targetType: 'user', action: 'BAN_USER', reason },
      }),
    ]);
    return user;
  }

  async approveCreator(userId: string, adminId: string) {
    const [user] = await Promise.all([
      this.db.user.update({
        where: { id: userId },
        data: { role: 'CREATOR', isCreator: true, creatorApproved: true },
      }),
      this.db.adminAction.create({
        data: { adminId, targetId: userId, targetType: 'user', action: 'APPROVE_CREATOR', reason: 'Creator approved' },
      }),
    ]);
    return user;
  }

  async getPendingCreators() {
    return this.db.user.findMany({
      where: { isCreator: true, creatorApproved: false },
      select: {
        id: true, name: true, email: true, username: true, createdAt: true,
        _count: { select: { courses: true } },
      },
    });
  }

  async approveCourse(courseId: string, adminId: string) {
    return this.db.course.update({
      where: { id: courseId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async rejectCourse(courseId: string, adminId: string, reason: string) {
    return this.db.course.update({
      where: { id: courseId },
      data: { status: 'REJECTED' },
    });
  }

  async getPendingCourses() {
    return this.db.course.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        _count: { select: { modules: true, enrollments: true } },
      },
    });
  }

  async getPayouts() {
    return this.db.payoutRequest.findMany({
      where: { status: 'pending' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async processReports() {
    return this.db.report.findMany({
      where: { status: 'PENDING' },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
