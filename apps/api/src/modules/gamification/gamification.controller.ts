import {
  Controller, Get, Post, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { GamificationService } from './gamification.service';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly svc: GamificationService) {}

  @Get('me')
  getMyStats(@CurrentUser() user: any) {
    return this.svc.getStats(user.id);
  }

  @Get('streak')
  getStreakHistory(
    @CurrentUser() user: any,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.svc.getStreakHistory(user.id, days);
  }

  @Get('missions')
  getMissions(@CurrentUser() user: any) {
    return this.svc.getMissions(user.id);
  }

  @Post('missions/:id/claim')
  claimMission(@CurrentUser() user: any, @Param('id') missionId: string) {
    return this.svc.claimMission(user.id, missionId);
  }

  @Get('badges')
  getBadges(@CurrentUser() user: any) {
    return this.svc.getBadges(user.id);
  }

  @Get('leaderboard')
  getLeaderboard(
    @Query('period') period: string = 'weekly',
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const p = period === 'alltime' ? 'all' : (period as any);
    return this.svc.getLeaderboard(limit, p);
  }

  @Get('battle-pass')
  getBattlePass(@CurrentUser() user: any) {
    return this.svc.getUserBattlePass(user.id);
  }

  @Post('battle-pass/claim/:tierId')
  claimBattlePassTier(@CurrentUser() user: any, @Param('tierId') tierId: string) {
    return this.svc.claimBattlePassTier(user.id, tierId);
  }

  @Post('battle-pass/unlock-premium')
  unlockPremium(@CurrentUser() user: any) {
    return this.svc.unlockBattlePassPremium(user.id);
  }

  @Get('shop')
  getShop() {
    return this.svc.getShopItems();
  }

  @Post('shop/:itemId/buy')
  buyShopItem(@CurrentUser() user: any, @Param('itemId') itemId: string) {
    return this.svc.buyShopItem(user.id, itemId);
  }
}
