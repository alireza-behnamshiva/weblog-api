import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { Comment } from './comment.entity';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Post, User]),
    AuthModule,
    JwtModule.register({}),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
