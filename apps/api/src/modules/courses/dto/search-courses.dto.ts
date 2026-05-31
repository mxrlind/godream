import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCoursesDto {
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() level?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isFree?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() maxPrice?: number;
  @ApiPropertyOptional({ enum: ['newest','popular','rating','price_asc','price_desc'] })
  @IsOptional() @IsString() sort?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100) limit?: number;
}
