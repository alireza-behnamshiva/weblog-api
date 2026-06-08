import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResult } from '../../common/dto/paginated-response.dto';
import { Category } from '../category.entity';

export class CategoryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export const toCategoryResponse = (
  category: Category,
): CategoryResponseDto => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description ?? null,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

export type PaginatedCategoryResponse = PaginatedResult<CategoryResponseDto>;

export const toPaginatedCategoryResponse = (
  result: PaginatedResult<Category>,
): PaginatedCategoryResponse => ({
  items: result.items.map(toCategoryResponse),
  meta: result.meta,
});
