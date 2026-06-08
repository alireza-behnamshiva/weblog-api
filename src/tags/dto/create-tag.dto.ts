import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'NestJS', minLength: 2, maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: 'nestjs', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;
}
