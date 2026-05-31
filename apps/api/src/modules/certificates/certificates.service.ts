import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@godream/database';
import { DATABASE_SERVICE } from '@/common/database/database.module';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class CertificatesService {
  private readonly appUrl: string;

  constructor(
    @Inject(DATABASE_SERVICE) private readonly db: PrismaClient,
    private readonly config: ConfigService,
  ) {
    this.appUrl = config.get('APP_URL', 'https://godream.io');
  }

  // ─── Issue certificate on course completion ────────────────
  async issueCertificate(userId: string, courseId: string) {
    // Check enrollment & completion
    const enrollment = await this.db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new NotFoundException('Matrícula não encontrada');
    if (!enrollment.completedAt && enrollment.progress < 100) {
      throw new BadRequestException('Curso não concluído');
    }

    // Check if already issued
    const existing = await this.db.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    const [user, course] = await Promise.all([
      this.db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
      this.db.course.findUnique({
        where: { id: courseId },
        include: { creator: { select: { id: true, name: true } } },
      }),
    ]);

    if (!user || !course) throw new NotFoundException('Dados não encontrados');

    // Generate unique certificate number
    const certNumber = [
      'GD',
      new Date().getFullYear(),
      randomBytes(4).toString('hex').toUpperCase(),
    ].join('-');

    const verifyUrl = `${this.appUrl}/verify/${certNumber}`;

    const certificate = await this.db.certificate.create({
      data: {
        userId,
        courseId,
        certificateNumber: certNumber,
        verifyUrl,
        metadata: {
          studentName: user.name,
          courseName: course.title,
          creatorName: course.creator.name,
          completedAt: enrollment.completedAt ?? new Date(),
        } as any,
      },
    });

    return certificate;
  }

  // ─── Get user certificates ─────────────────────────────────
  async getUserCertificates(userId: string) {
    return this.db.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, abbr: true, accentColor: true,
            creator: { select: { name: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  // ─── Verify certificate by code ────────────────────────────
  async verifyCertificate(code: string) {
    const cert = await this.db.certificate.findFirst({
      where: { certificateNumber: code },
      include: {
        user: { select: { id: true, name: true } },
        course: {
          select: {
            id: true, title: true, slug: true,
            creator: { select: { name: true } },
          },
        },
      },
    });

    if (!cert) throw new NotFoundException('Certificado não encontrado');
    return { valid: true, certificate: cert };
  }

  // ─── Get single certificate ────────────────────────────────
  async getCertificate(userId: string, courseId: string) {
    const cert = await this.db.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, abbr: true, accentColor: true,
            creator: { select: { name: true } },
          },
        },
      },
    });
    if (!cert) throw new NotFoundException('Certificado não encontrado');
    return cert;
  }
}
