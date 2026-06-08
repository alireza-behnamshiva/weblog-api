import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CategoryResponseDto,
  toCategoryResponse,
} from '../../categories/dto/category-response.dto';
import { PaginatedResult } from '../../common/dto/paginated-response.dto';
import { TagResponseDto, toTagResponse } from '../../tags/dto/tag-response.dto';
import {
  toUserResponse,
  UserResponseDto,
} from '../../users/dto/user-response.dto';
import { Post, PostStatus } from '../post.entity';

export class PostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  excerpt!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: PostStatus })
  status!: PostStatus;

  @ApiProperty()
  authorId!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiPropertyOptional({ type: UserResponseDto })
  author?: UserResponseDto;

  @ApiPropertyOptional({ type: CategoryResponseDto })
  category?: CategoryResponseDto;

  @ApiProperty({ type: [TagResponseDto] })
  tags!: TagResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  publishedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export const toPostResponse = (post: Post): PostResponseDto => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  status: post.status,
  authorId: post.authorId,
  categoryId: post.categoryId,
  author: post.author ? toUserResponse(post.author) : undefined,
  category: post.category ? toCategoryResponse(post.category) : undefined,
  tags: post.tags?.map(toTagResponse) ?? [],
  publishedAt: post.publishedAt ?? null,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

export type PaginatedPostResponse = PaginatedResult<PostResponseDto>;

export const toPaginatedPostResponse = (result: {
  items: Post[];
  meta: PaginatedPostResponse['meta'];
}): PaginatedPostResponse => ({
  items: result.items.map(toPostResponse),
  meta: result.meta,
});
