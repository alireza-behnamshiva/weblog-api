import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginatedResult } from '../../common/dto/paginated-response.dto';
import { User, UserRole } from '../user.entity';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiPropertyOptional({ nullable: true })
  bio?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export const toUserResponse = (user: User): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export type PaginatedUserResponse = PaginatedResult<UserResponseDto>;

export const toPaginatedUserResponse = (
  result: PaginatedResult<User>,
): PaginatedUserResponse => ({
  items: result.items.map(toUserResponse),
  meta: result.meta,
});
