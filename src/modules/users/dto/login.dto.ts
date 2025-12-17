import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'watthana@gmail.com',
    description: 'Email address'
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'Watthana@04',
    description: 'User password'
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password: string;
}
