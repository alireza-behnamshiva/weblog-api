import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
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

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
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
