import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';

const AUTHOR_SELECT = {
  id: true, name: true, username: true, avatarUrl: true, avatarColor: true, role: true,
};

@Injectable()
export class CommunityService {
  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
  ) {}

  // ─── Questions ────────────────────────────────────────────

  async getCourseQuestions(courseId: string, userId?: string, page = 1, limit = 15) {
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      this.db.courseQuestion.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { isAnswered: 'asc' }, { createdAt: 'desc' }],
        include: {
          author: { select: AUTHOR_SELECT },
          votes: userId ? { where: { userId }, select: { value: true } } : false,
          _count: { select: { answers: true } },
        },
      }),
      this.db.courseQuestion.count({ where: { courseId } }),
    ]);

    return {
      data: questions.map((q) => ({
        ...q,
        userVote: userId && (q.votes as any[]).length > 0 ? (q.votes as any[])[0].value : 0,
        votes: undefined,
        answerCount: q._count.answers,
        _count: undefined,
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getQuestion(questionId: string, userId?: string) {
    const question = await this.db.courseQuestion.findUnique({
      where: { id: questionId },
      include: {
        author: { select: AUTHOR_SELECT },
        votes: userId ? { where: { userId }, select: { value: true } } : false,
        answers: {
          orderBy: [{ isAccepted: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: { select: AUTHOR_SELECT },
            votes: userId ? { where: { userId }, select: { value: true } } : false,
          },
        },
      },
    });

    if (!question) throw new NotFoundException('Pergunta não encontrada');

    return {
      ...question,
      userVote: userId && (question.votes as any[]).length > 0 ? (question.votes as any[])[0].value : 0,
      votes: undefined,
      answers: question.answers.map((a) => ({
        ...a,
        userVote: userId && (a.votes as any[]).length > 0 ? (a.votes as any[])[0].value : 0,
        votes: undefined,
      })),
    };
  }

  async createQuestion(userId: string, courseId: string, title: string, body: string) {
    // Verify user is enrolled or is creator/admin
    const enrollment = await this.db.enrollment.findFirst({
      where: { userId, courseId },
    });
    const course = await this.db.course.findUnique({
      where: { id: courseId },
      select: { creatorId: true },
    });

    if (!enrollment && course?.creatorId !== userId) {
      throw new ForbiddenException('Você precisa estar matriculado para fazer perguntas');
    }

    return this.db.courseQuestion.create({
      data: { courseId, authorId: userId, title, body },
      include: {
        author: { select: AUTHOR_SELECT },
      },
    });
  }

  async voteQuestion(userId: string, questionId: string, value: 1 | -1) {
    const question = await this.db.courseQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Pergunta não encontrada');

    const existing = await this.db.courseQuestionVote.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });

    if (existing) {
      if (existing.value === value) {
        // Remove vote
        await Promise.all([
          this.db.courseQuestionVote.delete({ where: { userId_questionId: { userId, questionId } } }),
          this.db.courseQuestion.update({ where: { id: questionId }, data: { upvotes: { decrement: value } } }),
        ]);
        return { voted: false, value: 0 };
      } else {
        // Change vote
        const diff = value - existing.value;
        await Promise.all([
          this.db.courseQuestionVote.update({ where: { userId_questionId: { userId, questionId } }, data: { value } }),
          this.db.courseQuestion.update({ where: { id: questionId }, data: { upvotes: { increment: diff } } }),
        ]);
        return { voted: true, value };
      }
    } else {
      await Promise.all([
        this.db.courseQuestionVote.create({ data: { userId, questionId, value } }),
        this.db.courseQuestion.update({ where: { id: questionId }, data: { upvotes: { increment: value } } }),
      ]);
      return { voted: true, value };
    }
  }

  async deleteQuestion(userId: string, questionId: string) {
    const question = await this.db.courseQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Pergunta não encontrada');
    if (question.authorId !== userId) throw new ForbiddenException('Acesso negado');
    return this.db.courseQuestion.delete({ where: { id: questionId } });
  }

  // ─── Answers ──────────────────────────────────────────────

  async createAnswer(userId: string, questionId: string, body: string) {
    const question = await this.db.courseQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Pergunta não encontrada');

    const answer = await this.db.courseAnswer.create({
      data: { questionId, authorId: userId, body },
      include: {
        author: { select: AUTHOR_SELECT },
      },
    });

    return { ...answer, userVote: 0, votes: undefined };
  }

  async voteAnswer(userId: string, answerId: string, value: 1 | -1) {
    const answer = await this.db.courseAnswer.findUnique({ where: { id: answerId } });
    if (!answer) throw new NotFoundException('Resposta não encontrada');

    const existing = await this.db.courseAnswerVote.findUnique({
      where: { userId_answerId: { userId, answerId } },
    });

    if (existing) {
      if (existing.value === value) {
        await Promise.all([
          this.db.courseAnswerVote.delete({ where: { userId_answerId: { userId, answerId } } }),
          this.db.courseAnswer.update({ where: { id: answerId }, data: { upvotes: { decrement: value } } }),
        ]);
        return { voted: false, value: 0 };
      } else {
        const diff = value - existing.value;
        await Promise.all([
          this.db.courseAnswerVote.update({ where: { userId_answerId: { userId, answerId } }, data: { value } }),
          this.db.courseAnswer.update({ where: { id: answerId }, data: { upvotes: { increment: diff } } }),
        ]);
        return { voted: true, value };
      }
    } else {
      await Promise.all([
        this.db.courseAnswerVote.create({ data: { userId, answerId, value } }),
        this.db.courseAnswer.update({ where: { id: answerId }, data: { upvotes: { increment: value } } }),
      ]);
      return { voted: true, value };
    }
  }

  async acceptAnswer(userId: string, answerId: string) {
    const answer = await this.db.courseAnswer.findUnique({
      where: { id: answerId },
      include: { question: { include: { course: { select: { creatorId: true } } } } },
    });
    if (!answer) throw new NotFoundException('Resposta não encontrada');

    const isQuestionAuthor = answer.question.authorId === userId;
    const isCourseCreator = answer.question.course.creatorId === userId;
    if (!isQuestionAuthor && !isCourseCreator) throw new ForbiddenException('Acesso negado');

    // Unaccept any previously accepted answer
    await this.db.courseAnswer.updateMany({
      where: { questionId: answer.questionId, isAccepted: true },
      data: { isAccepted: false },
    });

    await Promise.all([
      this.db.courseAnswer.update({ where: { id: answerId }, data: { isAccepted: true } }),
      this.db.courseQuestion.update({ where: { id: answer.questionId }, data: { isAnswered: true } }),
    ]);

    return { accepted: true };
  }

  async deleteAnswer(userId: string, answerId: string) {
    const answer = await this.db.courseAnswer.findUnique({ where: { id: answerId } });
    if (!answer) throw new NotFoundException('Resposta não encontrada');
    if (answer.authorId !== userId) throw new ForbiddenException('Acesso negado');
    return this.db.courseAnswer.delete({ where: { id: answerId } });
  }
}
