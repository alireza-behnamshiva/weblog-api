import {
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
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    return this.usersRepository.save(
      this.usersRepository.create(createUserDto),
    );
  }

  async findAll(query: UserQueryDto): Promise<PaginatedResult<User>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateAuthorized(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<User> {
    this.assertCanManageUser(id, currentUser);
    const user = await this.findOne(id);
    const safeUpdate =
      currentUser.role === UserRole.Admin
        ? updateUserDto
        : this.omitRole(updateUserDto);

    return this.usersRepository.save(
      this.usersRepository.merge(user, safeUpdate),
    );
  }

  async removeAuthorized(
    id: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<void> {
    this.assertCanManageUser(id, currentUser);
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  private assertCanManageUser(
    id: string,
    currentUser: { id: string; role: UserRole },
  ): void {
    if (currentUser.role === UserRole.Admin || id === currentUser.id) {
      return;
    }

    throw new ForbiddenException('You are not allowed to modify this user');
  }

  private omitRole(updateUserDto: UpdateUserDto): UpdateUserDto {
    if (!updateUserDto.role) {
      return updateUserDto;
    }

    const safeUpdate = { ...updateUserDto };
    delete safeUpdate.role;

    return safeUpdate;
  }

  async findOneAuthorized(
    id: string,
    currentUser: { id: string; role: UserRole },
  ): Promise<User> {
    if (currentUser.role !== UserRole.Admin && id !== currentUser.id) {
      throw new ForbiddenException('You are not allowed to modify this user');
    }

    return this.findOne(id);
  }
}
