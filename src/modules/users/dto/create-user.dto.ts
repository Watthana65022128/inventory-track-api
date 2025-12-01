import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe', description: 'Unique username' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'User password', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.VIEWER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ example: '0812345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}
