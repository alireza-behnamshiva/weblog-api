import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toSlug } from '../common/slug';
import { CreateTagDto } from './dto/create-tag.dto';
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

  findAll(): Promise<Tag[]> {
    return this.tagsRepository.find({ order: { name: 'ASC' } });
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
