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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create post' })
  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.createForAuthor(createPostDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List posts' })
  findAll(@Query() query: PostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get post by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own post' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.updateForAuthor(id, updatePostDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own post' })
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.postsService.removeForAuthor(id, user.id);
  }
}
