import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { toSlug } from '../../common/slug';
import { PostStatus } from '../post.entity';

export class CreatePostDto {
  @ApiProperty({ example: 'First Post', minLength: 3, maxLength: 180 })
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({
    example: 'first-post',
    minLength: 1,
    maxLength: 220,
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? toSlug(value) : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(220)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiProperty({
    example: 'This is a short excerpt for the first post.',
    minLength: 10,
    maxLength: 300,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  excerpt!: string;

  @ApiProperty({
    example:
      'This is the full post content. It must be at least twenty characters long.',
    minLength: 20,
  })
  @IsString()
  @MinLength(20)
  content!: string;

  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.Published })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({
    description:
      'Ignored for authorized requests. The authenticated user becomes the author.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000002',
    format: 'uuid',
  })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['00000000-0000-4000-8000-000000000003'],
    uniqueItems: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
