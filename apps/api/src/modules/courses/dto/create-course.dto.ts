import { IsString, IsBoolean, IsOptional, IsEnum, IsNumber, IsArray, MinLength, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CourseLevelDto {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export class CreateCourseDto {
  @ApiProperty({ example: 'JavaScript Moderno' })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Aprenda JS do zero ao avançado...' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ example: 'Do zero ao avançado' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  shortDesc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: CourseLevelDto })
  @IsOptional()
  @IsEnum(CourseLevelDto)
  level?: string;

  @ApiProperty({ example: 'JS', minLength: 1, maxLength: 4 })
  @IsString()
  @MinLength(1)
  @MaxLength(4)
  abbr: string;

  @ApiPropertyOptional({ example: '#7c5cff' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional({ example: 79.90 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatYouLearn?: string[];

  @ApiPropertyOptional({ default: 'pt-BR' })
  @IsOptional()
  @IsString()
  language?: string;
}
