import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('creator')
  getCreatorAnalytics(@CurrentUser() user: any) {
    return this.svc.getCreatorAnalytics(user.id);
  }

  @Get('creator/courses/:courseId')
  getCourseAnalytics(
    @CurrentUser() user: any,
    @Param('courseId') courseId: string,
    @Query('days') days?: string,
  ) {
    return this.svc.getCourseAnalytics(user.id, courseId, days ? parseInt(days) : 30);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('platform')
  getPlatformMetrics(@Query('days') days?: string) {
    return this.svc.getPlatformMetrics(days ? parseInt(days) : 30);
  }
}
