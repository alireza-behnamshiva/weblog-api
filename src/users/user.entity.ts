import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comment } from '../comments/comment.entity';
import { Post } from '../posts/post.entity';

export enum UserRole {
  Admin = 'admin',
  User = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ unique: true, length: 180 })
  email!: string;

  @Column({ nullable: true, select: false })
  passwordHash?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role!: UserRole;

  @Column({ nullable: true, length: 500 })
  bio?: string;

  @OneToMany(() => Post, (post) => post.author)
  posts!: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
