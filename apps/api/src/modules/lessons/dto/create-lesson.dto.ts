import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LessonType } from '@godream/database';

export class CreateLessonDto {
  @IsString()
  moduleId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(LessonType)
  type: LessonType;

  @IsInt()
  @Min(0)
  order: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  muxPlaybackId?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class UpdateProgressDto {
  @IsInt()
  @Min(0)
  watchedPercent: number;

  @IsInt()
  @Min(0)
  watchedSeconds: number;

  @IsString()
  courseId: string;
}
