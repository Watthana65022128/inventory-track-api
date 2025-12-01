import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john_doe', description: 'Username or email' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
