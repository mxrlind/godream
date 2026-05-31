import {
  Controller, Get, Post, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { QuizzesService } from './quizzes.service';

@ApiTags('quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly svc: QuizzesService) {}

  @Get('lesson/:lessonId')
  getByLesson(@Param('lessonId') lessonId: string) {
    return this.svc.getQuizByLesson(lessonId);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id') quizId: string,
    @CurrentUser() user: any,
    @Body() body: { answers: Array<{ questionId: string; optionId?: string; textAnswer?: string }> },
  ) {
    return this.svc.submitQuiz(user.id, quizId, body.answers);
  }

  @Get(':id/my-submission')
  getMySubmission(@Param('id') quizId: string, @CurrentUser() user: any) {
    return this.svc.getUserSubmission(user.id, quizId);
  }

  // ─── Creator routes ────────────────────────────────────────
  @UseGuards(RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Post('lesson/:lessonId')
  createQuiz(
    @Param('lessonId') lessonId: string,
    @Body() body: any,
  ) {
    return this.svc.createQuiz(lessonId, body);
  }
}
