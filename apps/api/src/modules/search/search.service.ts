import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';

@Injectable()
export class SearchService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
  ) {}

  async search(query: string) {
    if (!query || query.trim().length < 2) return { courses: [], users: [] };
    const q = query.trim();

    const [courses, users] = await Promise.all([
      this.db.course.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { shortDesc: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
          ],
        },
        take: 6,
        select: {
          id: true, title: true, slug: true, abbr: true, accentColor: true,
          thumbnailUrl: true, thumbGrad: true, isFree: true, price: true,
          avgRating: true, enrolledCount: true,
          creator: { select: { name: true } },
        },
      }),
      this.db.user.findMany({
        where: {
          isBanned: false,
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 4,
        select: {
          id: true, username: true, name: true,
          avatarUrl: true, avatarColor: true, role: true, isVerified: true,
        },
      }),
    ]);

    return { courses, users };
  }
}
