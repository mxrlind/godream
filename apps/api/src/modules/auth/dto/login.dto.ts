import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'joao@email.com', description: 'Email ou username' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(1)
  password: string;
}
