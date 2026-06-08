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
import { Category } from './category.entity';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug: this.resolveSlug(createCategoryDto.slug ?? createCategoryDto.name),
    });

    return this.categoriesRepository.save(category);
  }

  async findAll(query: CategoryQueryDto): Promise<PaginatedResult<Category>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const queryBuilder = this.categoriesRepository
      .createQueryBuilder('category')
      .orderBy('category.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.slug ILIKE :search OR category.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug: this.resolveSlug(slug) },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);
    const nextSlug = updateCategoryDto.slug
      ? this.resolveSlug(updateCategoryDto.slug)
      : updateCategoryDto.name
        ? this.resolveSlug(updateCategoryDto.name)
        : category.slug;

    return this.categoriesRepository.save(
      this.categoriesRepository.merge(category, {
        ...updateCategoryDto,
        slug: nextSlug,
      }),
    );
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  private resolveSlug(value: string): string {
    const slug = toSlug(value);

    if (!slug) {
      throw new BadRequestException(
        'Category slug must contain letters or numbers',
      );
    }

    return slug;
  }
}
