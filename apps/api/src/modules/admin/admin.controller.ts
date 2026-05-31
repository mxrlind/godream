import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get('stats')
  getDashboardStats() {
    return this.svc.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.svc.getUsers(+page, +limit, search);
  }

  @Post('users/:id/ban')
  banUser(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { reason: string }) {
    return this.svc.banUser(id, body.reason, user.id);
  }

  @Post('users/:id/approve-creator')
  approveCreator(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.approveCreator(id, user.id);
  }

  @Get('creators/pending')
  getPendingCreators() {
    return this.svc.getPendingCreators();
  }

  @Get('courses/pending')
  getPendingCourses() {
    return this.svc.getPendingCourses();
  }

  @Post('courses/:id/approve')
  approveCourse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.approveCourse(id, user.id);
  }

  @Post('courses/:id/reject')
  rejectCourse(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { reason: string }) {
    return this.svc.rejectCourse(id, user.id, body.reason);
  }

  @Get('payouts')
  getPayouts() {
    return this.svc.getPayouts();
  }

  @Get('reports')
  getReports() {
    return this.svc.processReports();
  }
}
