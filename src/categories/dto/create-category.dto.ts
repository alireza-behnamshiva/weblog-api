import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { toSlug } from '../../common/slug';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Web Development', minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: 'web-development',
    minLength: 1,
    maxLength: 140,
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? toSlug(value) : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional({
    example: 'Frontend and backend posts',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
