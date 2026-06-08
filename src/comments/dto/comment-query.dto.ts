import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CommentStatus } from '../comment.entity';

export class CommentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'nice' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-4000-8000-000000000004',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  postId?: string;

  @ApiPropertyOptional({
    example: '00000000-0000-4000-8000-000000000001',
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

  @ApiPropertyOptional({ enum: CommentStatus, example: CommentStatus.Pending })
  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;
}
