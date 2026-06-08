import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from '../posts/post.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 120 })
  name!: string;

  @Column({ unique: true, length: 140 })
  slug!: string;

  @Column({ nullable: true, length: 500 })
  description?: string;

  @OneToMany(() => Post, (post) => post.category)
  posts!: Post[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
