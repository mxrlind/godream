import {
  Controller, Get, Patch, Post, Param, Body, Query, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.svc.findById(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.svc.update(user.id, dto);
  }

  @Get('me/enrollments')
  getMyEnrollments(@CurrentUser() user: any) {
    return this.svc.getMyEnrollments(user.id);
  }

  @Post('me/creator-request')
  requestCreator(@CurrentUser() user: any) {
    return this.svc.requestCreator(user.id);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new BadRequestException('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.svc.uploadAvatar(user.id, file);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.svc.search(q || '');
  }

  @Get(':id/profile')
  getPublicProfile(@Param('id') id: string) {
    return this.svc.getPublicProfile(id);
  }
}
