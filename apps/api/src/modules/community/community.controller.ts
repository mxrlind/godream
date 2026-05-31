import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { JwtOptionalGuard } from '@/common/guards/jwt-optional.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { Public } from '@/common/decorators/roles.decorator';
import { CommunityService } from './community.service';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly svc: CommunityService) {}

  // ─── Questions ────────────────────────────────────────────

  @Public()
  @UseGuards(JwtOptionalGuard)
  @Get('courses/:courseId/questions')
  getCourseQuestions(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
  ) {
    return this.svc.getCourseQuestions(courseId, user?.id, page, limit);
  }

  @Public()
  @UseGuards(JwtOptionalGuard)
  @Get('questions/:questionId')
  getQuestion(@Param('questionId') questionId: string, @CurrentUser() user: any) {
    return this.svc.getQuestion(questionId, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('courses/:courseId/questions')
  createQuestion(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Body() body: { title: string; body: string },
  ) {
    return this.svc.createQuestion(user.id, courseId, body.title, body.body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('questions/:questionId/vote')
  @HttpCode(HttpStatus.OK)
  voteQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
    @Body() body: { value: 1 | -1 },
  ) {
    return this.svc.voteQuestion(user.id, questionId, body.value);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('questions/:questionId')
  deleteQuestion(@Param('questionId') questionId: string, @CurrentUser() user: any) {
    return this.svc.deleteQuestion(user.id, questionId);
  }

  // ─── Answers ──────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('questions/:questionId/answers')
  createAnswer(
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
    @Body() body: { body: string },
  ) {
    return this.svc.createAnswer(user.id, questionId, body.body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('answers/:answerId/vote')
  @HttpCode(HttpStatus.OK)
  voteAnswer(
    @Param('answerId') answerId: string,
    @CurrentUser() user: any,
    @Body() body: { value: 1 | -1 },
  ) {
    return this.svc.voteAnswer(user.id, answerId, body.value);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('answers/:answerId/accept')
  @HttpCode(HttpStatus.OK)
  acceptAnswer(@Param('answerId') answerId: string, @CurrentUser() user: any) {
    return this.svc.acceptAnswer(user.id, answerId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('answers/:answerId')
  deleteAnswer(@Param('answerId') answerId: string, @CurrentUser() user: any) {
    return this.svc.deleteAnswer(user.id, answerId);
  }
}
