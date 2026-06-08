import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CommentStatus } from '../comment.entity';

export class ModerateCommentDto {
  @ApiProperty({ enum: CommentStatus, example: CommentStatus.Approved })
  @IsEnum(CommentStatus)
  status!: CommentStatus;
}
