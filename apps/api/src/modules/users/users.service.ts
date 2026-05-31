import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';
import { UpdateUserDto } from './dto/update-user.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    private readonly storage: StorageService,
  ) {}

  async findById(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        avatarColor: true,
        bio: true,
        role: true,
        isVerified: true,
        isCreator: true,
        creatorApproved: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async getPublicProfile(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        avatarColor: true,
        bio: true,
        role: true,
        isVerified: true,
        isCreator: true,
        createdAt: true,
        gamification: {
          select: {
            xp: true,
            level: true,
            totalXp: true,
            streak: true,
            longestStreak: true,
            rank: true,
            lessonsCompleted: true,
            coursesCompleted: true,
            minutesStudied: true,
          },
        },
        badgeUnlocks: {
          include: { badge: true },
          orderBy: { unlockedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            enrollments: true,
            followers: true,
            following: true,
            feedPosts: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(userId: string, dto: UpdateUserDto) {
    return this.db.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatarUrl: true,
        avatarColor: true,
        bio: true,
        role: true,
        isVerified: true,
        isCreator: true,
        creatorApproved: true,
      },
    });
  }

  async getMyEnrollments(userId: string) {
    return this.db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            abbr: true,
            accentColor: true,
            thumbGrad: true,
            thumbnailUrl: true,
            totalLessons: true,
            totalDuration: true,
            creator: { select: { id: true, name: true, avatarUrl: true, avatarColor: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async search(query: string, limit = 10) {
    return this.db.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
        isBanned: false,
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        avatarColor: true,
        role: true,
        isVerified: true,
      },
      take: limit,
    });
  }

  async requestCreator(userId: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { isCreator: true },
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const key = `avatars/${userId}/${Date.now()}-${file.originalname.replace(/[^a-z0-9.]/gi, '_')}`;
    const { url } = await this.storage.upload(
      key,
      file.buffer,
      file.mimetype,
      'public-read',
    );

    const user = await this.db.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: { id: true, avatarUrl: true },
    });

    return user;
  }
}
