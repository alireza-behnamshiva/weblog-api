import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CategoriesController } from './categories.controller';
import { Category } from './category.entity';
import { CategoriesService } from './categories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    AuthModule,
    JwtModule.register({}),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
