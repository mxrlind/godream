import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { JwtOptionalGuard } from '@/common/guards/jwt-optional.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles, Public } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { LessonsService } from './lessons.service';
import { CreateLessonDto, UpdateProgressDto } from './dto/create-lesson.dto';

@ApiTags('lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly svc: LessonsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  @Patch(':id/progress')
  saveProgress(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.svc.saveProgress(user.id, id, dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  completeLesson(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { courseId: string },
  ) {
    return this.svc.completeLesson(user.id, id, body.courseId);
  }

  @Get(':id/my-progress')
  getUserProgress(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.getUserProgress(user.id, id);
  }

  // ─── Creator routes ────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Post()
  create(@Body() dto: CreateLessonDto) {
    return this.svc.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateLessonDto>) {
    return this.svc.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.delete(id);
  }

  // ─── Lesson Comments ───────────────────────────────────────

  @Public()
  @UseGuards(JwtOptionalGuard)
  @Get(':id/comments')
  getLessonComments(
    @Param('id') lessonId: string,
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.getLessonComments(lessonId, user?.id, page, limit);
  }

  @Post(':id/comments')
  createComment(
    @Param('id') lessonId: string,
    @CurrentUser() user: any,
    @Body() body: { body: string; parentId?: string; timestamp?: number },
  ) {
    return this.svc.createLessonComment(user.id, lessonId, body.body, body.parentId, body.timestamp);
  }

  @Post('comments/:commentId/like')
  @HttpCode(HttpStatus.OK)
  likeComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.svc.likeComment(user.id, commentId);
  }

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.svc.deleteComment(user.id, commentId);
  }

  @Patch('comments/:commentId/pin')
  @HttpCode(HttpStatus.OK)
  pinComment(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    return this.svc.pinComment(user.id, commentId);
  }
}
