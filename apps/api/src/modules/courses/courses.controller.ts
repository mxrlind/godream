import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { SearchCoursesDto } from './dto/search-courses.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly svc: CoursesService) {}

  // ─── Public routes ─────────────────────────────────────────
  @Get('categories')
  getCategories() {
    return this.svc.getCategories();
  }

  @Get()
  findAll(@Query() dto: SearchCoursesDto, @CurrentUser() user: any) {
    return this.svc.findAll(dto, user?.id);
  }

  // ─── Student: enrolled courses (must be before :slug) ──────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-courses')
  getMyEnrollments(@CurrentUser() user: any) {
    return this.svc.getMyEnrollments(user.id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.svc.findOne(slug, user?.id);
  }

  // ─── Auth required ─────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/enroll')
  @HttpCode(HttpStatus.OK)
  enroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.enroll(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/enrollment')
  getEnrollment(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.getEnrollment(user.id, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  createReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.svc.createReview(user.id, id, body.rating, body.comment);
  }

  // ─── Creator routes ────────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateCourseDto) {
    return this.svc.create(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: Partial<CreateCourseDto>) {
    return this.svc.update(id, user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Patch(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.publish(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Get('creator/my-courses')
  myCourses(@CurrentUser() user: any) {
    return this.svc.getCreatorCourses(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Get('editor/:id')
  findForEditor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.findOneForEditor(id, user.id);
  }

  // ─── Module management ─────────────────────────────────────
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Post(':id/modules')
  createModule(
    @Param('id') courseId: string,
    @CurrentUser() user: any,
    @Body() body: { title: string; description?: string; order?: number },
  ) {
    return this.svc.createModule(courseId, user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Patch(':id/modules/:moduleId')
  updateModule(
    @Param('id') courseId: string,
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: any,
    @Body() body: { title?: string; description?: string; order?: number; isFree?: boolean },
  ) {
    return this.svc.updateModule(courseId, moduleId, user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'ADMIN')
  @Delete(':id/modules/:moduleId')
  @HttpCode(HttpStatus.OK)
  deleteModule(
    @Param('id') courseId: string,
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: any,
  ) {
    return this.svc.deleteModule(courseId, moduleId, user.id);
  }
}
