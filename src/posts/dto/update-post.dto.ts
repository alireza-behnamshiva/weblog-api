import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Updated Post',
    minLength: 3,
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title?: string;

  @ApiPropertyOptional({
    example: 'updated-post',
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

  @ApiPropertyOptional({
    example: 'This is an updated excerpt.',
    minLength: 10,
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  excerpt?: string;

  @ApiPropertyOptional({
    example:
      'This is updated post content. It must be at least twenty characters long.',
    minLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  content?: string;

  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.Published })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({
    description:
      'Ignored for authorized requests. Post ownership cannot be transferred.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-4000-8000-000000000002',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

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
