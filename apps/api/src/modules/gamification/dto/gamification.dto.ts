import { IsIn, IsOptional } from 'class-validator';

export class LeaderboardQueryDto {
  @IsOptional()
  @IsIn(['weekly', 'monthly', 'alltime'])
  period?: 'weekly' | 'monthly' | 'alltime' = 'weekly';
}
