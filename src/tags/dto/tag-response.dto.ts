import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResult } from '../../common/dto/paginated-response.dto';
import { Tag } from '../tag.entity';

export class TagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export const toTagResponse = (tag: Tag): TagResponseDto => ({
  id: tag.id,
  name: tag.name,
  slug: tag.slug,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

export type PaginatedTagResponse = PaginatedResult<TagResponseDto>;

export const toPaginatedTagResponse = (
  result: PaginatedResult<Tag>,
): PaginatedTagResponse => ({
  items: result.items.map(toTagResponse),
  meta: result.meta,
});
