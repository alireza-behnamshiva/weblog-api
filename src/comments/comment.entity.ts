import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  authorName!: string;

  @Column({ nullable: true, length: 180 })
  authorEmail?: string;

  @Column('text')
  content!: string;

  @ManyToOne(() => Post, (post) => post.comments, { nullable: false })
  @JoinColumn({ name: 'postId' })
  post!: Post;

  @Column()
  postId!: string;

  @ManyToOne(() => User, (user) => user.comments, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author?: User;

  @Column({ nullable: true })
  authorId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
