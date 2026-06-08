import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Ali Reza', minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'ali@example.com', maxLength: 180 })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiPropertyOptional({ example: 'Backend developer', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
