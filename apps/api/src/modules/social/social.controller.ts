import {
  Controller, Get, Post, Delete, Param, Body, Query,
  ParseIntPipe, DefaultValuePipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { SocialService } from './social.service';

@ApiTags('social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly svc: SocialService) {}

  @Get('feed')
  getFeed(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(15), ParseIntPipe) limit: number,
  ) {
    return this.svc.getFeed(user.id, page, limit);
  }

  @Post('posts')
  createPost(@CurrentUser() user: any, @Body() body: { body: string; imageUrl?: string }) {
    return this.svc.createPost(user.id, body.body, body.imageUrl);
  }

  @Delete('posts/:id')
  deletePost(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.deletePost(user.id, id);
  }

  @Post('posts/:id/like')
  @HttpCode(HttpStatus.OK)
  likePost(@CurrentUser() user: any, @Param('id') id: string) {
    return this.svc.likePost(user.id, id);
  }

  @Post('posts/:id/comments')
  createComment(
    @CurrentUser() user: any,
    @Param('id') postId: string,
    @Body() body: { body: string },
  ) {
    return this.svc.createComment(user.id, postId, body.body);
  }

  @Post('follow/:userId')
  @HttpCode(HttpStatus.OK)
  follow(@CurrentUser() user: any, @Param('userId') targetId: string) {
    return this.svc.follow(user.id, targetId);
  }

  @Get('users/:userId/posts')
  getUserPosts(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.svc.getUserPosts(userId, page);
  }
}
