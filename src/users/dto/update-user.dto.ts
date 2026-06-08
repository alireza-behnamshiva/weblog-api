import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ali Reza', minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'ali@example.com', maxLength: 180 })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @ApiPropertyOptional({ example: 'Updated bio', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.User })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
