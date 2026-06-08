import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create tag' })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'List tags' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tag by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by ID' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update tag' })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete tag' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
