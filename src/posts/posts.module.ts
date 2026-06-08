import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Category } from '../categories/category.entity';
import { Tag } from '../tags/tag.entity';
import { User } from '../users/user.entity';
import { Post } from './post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User, Category, Tag]),
    AuthModule,
    JwtModule.register({}),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
