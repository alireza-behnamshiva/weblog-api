import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../common/dto/paginated-response.dto';
import { Post } from '../posts/post.entity';
import { User, UserRole } from '../users/user.entity';
import { Comment, CommentStatus } from './comment.entity';
import { CommentQueryDto } from './dto/comment-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ModerateCommentDto } from './dto/moderate-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createForAuthor(
    createCommentDto: CreateCommentDto,
    authorId: string,
  ): Promise<Comment> {
    const [post, author, parent] = await Promise.all([
      this.findPost(createCommentDto.postId),
      this.findAuthor(authorId),
      createCommentDto.parentId
        ? this.findParent(createCommentDto.parentId)
        : undefined,
    ]);

    if (parent && parent.postId !== post.id) {
      throw new BadRequestException('Parent comment must belong to the post');
    }

    const comment = this.commentsRepository.create({
      authorName: createCommentDto.authorName,
      authorEmail: createCommentDto.authorEmail,
      content: createCommentDto.content,
      post,
      author,
      parent,
    });

    return this.commentsRepository.save(comment);
  }

  async findAllApproved(
    query: CommentQueryDto,
  ): Promise<PaginatedResult<Comment>> {
    return this.findAll(query, {
      status: CommentStatus.Approved,
      rootOnlyByDefault: true,
    });
  }

  async findAllForModeration(
    query: CommentQueryDto,
  ): Promise<PaginatedResult<Comment>> {
    return this.findAll(query, {
      status: query.status,
      rootOnlyByDefault: false,
    });
  }

  async findOneApproved(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id, status: CommentStatus.Approved },
      relations: { post: true, author: true, children: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.children = (comment.children ?? []).filter(
      (child) => child.status === CommentStatus.Approved,
    );

    return comment;
  }

  async findAll(
    query: CommentQueryDto,
    options: {
      status?: CommentStatus;
      rootOnlyByDefault: boolean;
    },
  ): Promise<PaginatedResult<Comment>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const queryBuilder = this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.post', 'post')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect(
        'comment.children',
        'child',
        options.status ? 'child.status = :childStatus' : undefined,
        options.status ? { childStatus: options.status } : undefined,
      )
      .leftJoinAndSelect('child.author', 'childAuthor')
      .orderBy('comment.createdAt', 'DESC')
      .addOrderBy('child.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (options.status) {
      queryBuilder.andWhere('comment.status = :status', {
        status: options.status,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(comment.authorName ILIKE :search OR comment.authorEmail ILIKE :search OR comment.content ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.postId) {
      queryBuilder.andWhere('comment.postId = :postId', {
        postId: query.postId,
      });
    }

    if (query.authorId) {
      queryBuilder.andWhere('comment.authorId = :authorId', {
        authorId: query.authorId,
      });
    }

    if (query.parentId) {
      queryBuilder.andWhere('comment.parentId = :parentId', {
        parentId: query.parentId,
      });
    } else if (options.rootOnlyByDefault) {
      queryBuilder.andWhere('comment.parentId IS NULL');
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: { post: true, author: true, children: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async moderate(
    id: string,
    moderateCommentDto: ModerateCommentDto,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    return this.commentsRepository.save(
      this.commentsRepository.merge(comment, {
        status: moderateCommentDto.status,
      }),
    );
  }

  async updateForAuthor(
    id: string,
    updateCommentDto: UpdateCommentDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<Comment> {
    const comment = await this.findOne(id);
    this.assertAuthorOrAdmin(comment, currentUser);

    return this.commentsRepository.save(
      this.commentsRepository.merge(comment, updateCommentDto),
    );
  }

  async removeForAuthor(
    id: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<void> {
    const comment = await this.findOne(id);
    this.assertAuthorOrAdmin(comment, currentUser);
    await this.commentsRepository.softRemove(comment);
  }

  async restoreForAuthor(
    id: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: { author: true, post: true },
      withDeleted: true,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    this.assertAuthorOrAdmin(comment, currentUser);
    await this.commentsRepository.recover(comment);

    return this.findOne(id);
  }

  private assertAuthorOrAdmin(
    comment: Comment,
    currentUser: { id: string; role: UserRole },
  ): void {
    if (
      currentUser.role !== UserRole.Admin &&
      comment.authorId !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You are not allowed to modify this comment',
      );
    }
  }

  private async findPost(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private async findAuthor(id: string): Promise<User> {
    const author = await this.usersRepository.findOne({ where: { id } });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    return author;
  }

  private async findParent(id: string): Promise<Comment> {
    const parent = await this.commentsRepository.findOne({ where: { id } });

    if (!parent) {
      throw new NotFoundException('Parent comment not found');
    }

    return parent;
  }
}
