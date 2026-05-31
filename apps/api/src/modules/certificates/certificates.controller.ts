import {
  Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { CertificatesService } from './certificates.service';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly svc: CertificatesService) {}

  // ─── Public: verify certificate ───────────────────────────
  @Get('verify/:code')
  verify(@Param('code') code: string) {
    return this.svc.verifyCertificate(code);
  }

  // ─── Auth required ─────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyCertificates(@CurrentUser() user: any) {
    return this.svc.getUserCertificates(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('courses/:courseId')
  getCertificate(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.svc.getCertificate(user.id, courseId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('courses/:courseId/issue')
  @HttpCode(HttpStatus.CREATED)
  issueCertificate(@Param('courseId') courseId: string, @CurrentUser() user: any) {
    return this.svc.issueCertificate(user.id, courseId);
  }
}
