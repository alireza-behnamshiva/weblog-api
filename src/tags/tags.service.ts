import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../common/dto/paginated-response.dto';
import { toSlug } from '../common/slug';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagQueryDto } from './dto/tag-query.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  create(createTagDto: CreateTagDto): Promise<Tag> {
    const tag = this.tagsRepository.create({
      ...createTagDto,
      slug: this.resolveSlug(createTagDto.slug ?? createTagDto.name),
    });

    return this.tagsRepository.save(tag);
  }

  async findAll(query: TagQueryDto): Promise<PaginatedResult<Tag>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const queryBuilder = this.tagsRepository
      .createQueryBuilder('tag')
      .orderBy('tag.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      queryBuilder.andWhere(
        '(tag.name ILIKE :search OR tag.slug ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagsRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagsRepository.findOne({
      where: { slug: this.resolveSlug(slug) },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);
    const nextSlug = updateTagDto.slug
      ? this.resolveSlug(updateTagDto.slug)
      : updateTagDto.name
        ? this.resolveSlug(updateTagDto.name)
        : tag.slug;

    return this.tagsRepository.save(
      this.tagsRepository.merge(tag, {
        ...updateTagDto,
        slug: nextSlug,
      }),
    );
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagsRepository.remove(tag);
  }

  private resolveSlug(value: string): string {
    const slug = toSlug(value);

    if (!slug) {
      throw new BadRequestException('Tag slug must contain letters or numbers');
    }

    return slug;
  }
}
