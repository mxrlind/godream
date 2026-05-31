import { Controller, Get, Patch, Delete, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.svc.findAll(user.id, page, limit);
  }

  @Get('unread-count')
  countUnread(@CurrentUser() user: any) {
    return this.svc.countUnread(user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.svc.markAllRead(user.id);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.markRead(user.id, id);
  }
}
