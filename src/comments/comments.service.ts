import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/post.entity';
import { User, UserRole } from '../users/user.entity';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
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
    const [post, author] = await Promise.all([
      this.findPost(createCommentDto.postId),
      this.findAuthor(authorId),
    ]);

    const comment = this.commentsRepository.create({
      authorName: createCommentDto.authorName,
      authorEmail: createCommentDto.authorEmail,
      content: createCommentDto.content,
      post,
      author,
    });

    return this.commentsRepository.save(comment);
  }

  findAll(): Promise<Comment[]> {
    return this.commentsRepository.find({
      relations: { post: true, author: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: { post: true, author: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
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
}
