import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResult } from '../../common/dto/paginated-response.dto';
import {
  toUserResponse,
  UserResponseDto,
} from '../../users/dto/user-response.dto';
import { Comment, CommentStatus } from '../comment.entity';

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  authorName!: string;

  @ApiPropertyOptional({ nullable: true })
  authorEmail?: string | null;

  @ApiProperty()
  content!: string;

  @ApiProperty({ enum: CommentStatus })
  status!: CommentStatus;

  @ApiProperty()
  postId!: string;

  @ApiPropertyOptional({ nullable: true })
  authorId?: string | null;

  @ApiPropertyOptional({ type: UserResponseDto, nullable: true })
  author?: UserResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  parentId?: string | null;

  @ApiPropertyOptional({ type: () => [CommentResponseDto] })
  children?: CommentResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export const toCommentResponse = (comment: Comment): CommentResponseDto => ({
  id: comment.id,
  authorName: comment.authorName,
  authorEmail: comment.authorEmail ?? null,
  content: comment.content,
  status: comment.status,
  postId: comment.postId,
  authorId: comment.authorId ?? null,
  author: comment.author ? toUserResponse(comment.author) : null,
  parentId: comment.parentId ?? null,
  children: comment.children?.map(toCommentResponse),
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export type PaginatedCommentResponse = PaginatedResult<CommentResponseDto>;

export const toPaginatedCommentResponse = (
  result: PaginatedResult<Comment>,
): PaginatedCommentResponse => ({
  items: result.items.map(toCommentResponse),
  meta: result.meta,
});
