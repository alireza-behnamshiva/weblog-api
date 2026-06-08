import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Comment } from '../comments/comment.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';

export enum PostStatus {
  Draft = 'draft',
  Published = 'published',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 180 })
  title!: string;

  @Column({ unique: true, length: 220 })
  slug!: string;

  @Column({ length: 300 })
  excerpt!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.Draft })
  status!: PostStatus;

  @ManyToOne(() => User, (user) => user.posts, { nullable: false })
  @JoinColumn({ name: 'authorId' })
  author!: User;

  @Column()
  authorId!: string;

  @ManyToOne(() => Category, (category) => category.posts, { nullable: false })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column()
  categoryId!: string;

  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
