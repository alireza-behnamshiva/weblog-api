import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginationMetaDto;
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMetaDto => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
