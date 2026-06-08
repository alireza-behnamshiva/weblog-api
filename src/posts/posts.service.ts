import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { toSlug } from '../common/slug';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostStatus } from './post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  async createForAuthor(
    createPostDto: CreatePostDto,
    authorId: string,
  ): Promise<Post> {
    const [author, category, tags] = await Promise.all([
      this.findAuthor(authorId),
      this.findCategory(createPostDto.categoryId),
      this.findTags(createPostDto.tagIds ?? []),
    ]);

    const status = createPostDto.status ?? PostStatus.Draft;
    const post = this.postsRepository.create({
      title: createPostDto.title,
      excerpt: createPostDto.excerpt,
      content: createPostDto.content,
      slug: this.resolveSlug(createPostDto.slug ?? createPostDto.title),
      status,
      publishedAt: status === PostStatus.Published ? new Date() : undefined,
      author,
      category,
      tags,
    });

    return this.postsRepository.save(post);
  }

  async findAll(query: PostQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .orderBy('post.createdAt', query.sort === 'oldest' ? 'ASC' : 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.categorySlug) {
      queryBuilder.andWhere('category.slug = :categorySlug', {
        categorySlug: query.categorySlug,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('post.status = :status', { status: query.status });
    }

    if (query.authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', {
        authorId: query.authorId,
      });
    }

    if (query.tagId) {
      queryBuilder.andWhere('tag.id = :tagId', { tagId: query.tagId });
    }

    if (query.tagSlug) {
      queryBuilder.andWhere('tag.slug = :tagSlug', { tagSlug: query.tagSlug });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: { author: true, category: true, tags: true, comments: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { slug: this.resolveSlug(slug) },
      relations: { author: true, category: true, tags: true, comments: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async updateForAuthor(
    id: string,
    updatePostDto: UpdatePostDto,
    authorId: string,
  ): Promise<Post> {
    const post = await this.findOne(id);

    this.assertAuthor(post, authorId);

    const [author, category, tags] = await Promise.all([
      this.findAuthor(authorId),
      updatePostDto.categoryId
        ? this.findCategory(updatePostDto.categoryId)
        : post.category,
      updatePostDto.tagIds ? this.findTags(updatePostDto.tagIds) : post.tags,
    ]);

    const nextStatus = updatePostDto.status ?? post.status;
    const shouldPublish =
      post.status !== PostStatus.Published &&
      nextStatus === PostStatus.Published;

    return this.postsRepository.save(
      this.postsRepository.merge(post, {
        ...updatePostDto,
        slug: updatePostDto.slug
          ? this.resolveSlug(updatePostDto.slug)
          : updatePostDto.title
            ? this.resolveSlug(updatePostDto.title)
            : post.slug,
        status: nextStatus,
        publishedAt: shouldPublish ? new Date() : post.publishedAt,
        author,
        category,
        tags,
      }),
    );
  }

  async removeForAuthor(id: string, authorId: string): Promise<void> {
    const post = await this.findOne(id);
    this.assertAuthor(post, authorId);
    await this.postsRepository.softRemove(post);
  }

  async restoreForAuthor(id: string, authorId: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: { author: true, category: true, tags: true },
      withDeleted: true,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    this.assertAuthor(post, authorId);
    await this.postsRepository.recover(post);

    return this.findOne(id);
  }

  private assertAuthor(post: Post, authorId: string): void {
    if (post.authorId !== authorId) {
      throw new ForbiddenException('You are not allowed to modify this post');
    }
  }

  private resolveSlug(value: string): string {
    const slug = toSlug(value);

    if (!slug) {
      throw new BadRequestException(
        'Post slug must contain letters or numbers',
      );
    }

    return slug;
  }

  private async findAuthor(id: string): Promise<User> {
    const author = await this.usersRepository.findOne({ where: { id } });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    return author;
  }

  private async findCategory(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async findTags(ids: string[]): Promise<Tag[]> {
    if (ids.length === 0) {
      return [];
    }

    const tags = await this.tagsRepository.find({ where: { id: In(ids) } });

    if (tags.length !== ids.length) {
      throw new BadRequestException('One or more tags were not found');
    }

    return tags;
  }
}
