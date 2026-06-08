import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Visitor', minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  authorName!: string;

  @ApiPropertyOptional({ example: 'visitor@example.com', maxLength: 180 })
  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  authorEmail?: string;

  @ApiProperty({ example: 'Nice post.', minLength: 2 })
  @IsString()
  @MinLength(2)
  content!: string;

  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000004',
    format: 'uuid',
  })
  @IsUUID()
  postId!: string;

  @ApiPropertyOptional({
    description:
      'Ignored for authorized requests. The authenticated user becomes the author.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-4000-8000-000000000005',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
