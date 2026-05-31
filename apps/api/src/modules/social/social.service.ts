import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';

const POST_SELECT = {
  id: true,
  authorId: true,
  body: true,
  imageUrl: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true, avatarColor: true } },
};

@Injectable()
export class SocialService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
  ) {}

  async getFeed(userId: string, page = 1, limit = 15) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.db.feedPost.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          ...POST_SELECT,
          likes: { where: { userId }, select: { id: true } },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true, body: true, likeCount: true, createdAt: true,
              author: { select: { id: true, name: true, avatarUrl: true, avatarColor: true } },
            },
          },
        },
      }),
      this.db.feedPost.count(),
    ]);

    return {
      data: posts.map((p) => ({
        ...p,
        liked: p.likes.length > 0,
        likes: undefined,
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async createPost(userId: string, body: string, imageUrl?: string) {
    if (!body.trim()) throw new ForbiddenException('Post não pode estar vazio');
    return this.db.feedPost.create({
      data: { authorId: userId, body, imageUrl },
      select: POST_SELECT,
    });
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.db.feedPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post não encontrado');
    if (post.authorId !== userId) throw new ForbiddenException('Acesso negado');
    return this.db.feedPost.delete({ where: { id: postId } });
  }

  async likePost(userId: string, postId: string) {
    const existing = await this.db.feedLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      await Promise.all([
        this.db.feedLike.delete({ where: { userId_postId: { userId, postId } } }),
        this.db.feedPost.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return { liked: false };
    } else {
      await Promise.all([
        this.db.feedLike.create({ data: { userId, postId } }),
        this.db.feedPost.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
      ]);
      return { liked: true };
    }
  }

  async createComment(userId: string, postId: string, body: string) {
    const [comment] = await Promise.all([
      this.db.feedComment.create({
        data: { authorId: userId, postId, body },
        select: {
          id: true, body: true, likeCount: true, createdAt: true,
          author: { select: { id: true, name: true, avatarUrl: true, avatarColor: true } },
        },
      }),
      this.db.feedPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);
    return comment;
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new ForbiddenException('Você não pode se seguir');
    const existing = await this.db.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await this.db.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
      return { following: false };
    } else {
      await this.db.follow.create({ data: { followerId, followingId } });
      return { following: true };
    }
  }

  async getUserPosts(userId: string, page = 1, limit = 15) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.db.feedPost.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: POST_SELECT,
      }),
      this.db.feedPost.count({ where: { authorId: userId } }),
    ]);
    return { data: posts, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
