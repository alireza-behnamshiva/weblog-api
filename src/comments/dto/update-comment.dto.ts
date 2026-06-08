import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Visitor', minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  authorName?: string;

  @ApiPropertyOptional({ example: 'visitor@example.com', maxLength: 180 })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  authorEmail?: string;

  @ApiPropertyOptional({ example: 'Updated comment text.', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  content?: string;
}
