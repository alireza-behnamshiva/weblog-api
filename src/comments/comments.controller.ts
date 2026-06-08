import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { CommentsService } from './comments.service';
import { CommentQueryDto } from './dto/comment-query.dto';
import {
  toCommentResponse,
  toPaginatedCommentResponse,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create comment' })
  @Post()
  create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService
      .createForAuthor(createCommentDto, user.id)
      .then(toCommentResponse);
  }

  @Get()
  @ApiOperation({ summary: 'List comments' })
  findAll(@Query() query: CommentQueryDto) {
    return this.commentsService
      .findAllApproved(query)
      .then(toPaginatedCommentResponse);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Get('moderation')
  @ApiOperation({ summary: 'List comments for moderation' })
  findAllForModeration(@Query() query: CommentQueryDto) {
    return this.commentsService
      .findAllForModeration(query)
      .then(toPaginatedCommentResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by ID' })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOneApproved(id).then(toCommentResponse);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate comment' })
  @Patch(':id/moderate')
  moderate(
    @Param('id') id: string,
    @Body() moderateCommentDto: ModerateCommentDto,
  ) {
    return this.commentsService
      .moderate(id, moderateCommentDto)
      .then(toCommentResponse);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own comment' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.commentsService
      .updateForAuthor(id, updateCommentDto, user)
      .then(toCommentResponse);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.commentsService.removeForAuthor(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore own deleted comment' })
  @Patch(':id/restore')
  restore(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.commentsService
      .restoreForAuthor(id, user)
      .then(toCommentResponse);
  }
}
