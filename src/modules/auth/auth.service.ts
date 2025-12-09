import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import {
  LoginResponse,
  AuthTokens,
} from '../../common/interfaces/auth.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.is_active) {
      return null;
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User): Promise<LoginResponse> {
    const tokens = await this.tokenService.generateTokens(user);

    // Save refresh token to database
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      message: 'Login successful',
      ...tokens, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        is_active: user.is_active,
      },
    };
  }

  async register(createUserDto: CreateUserDto): Promise<LoginResponse> {
    const user = await this.usersService.create(createUserDto);
    const loginResponse = await this.login(user);
    return {
      ...loginResponse,
      message: 'User registered successfully',
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string): Promise<AuthTokens> {
    const user = await this.usersService.findOne(userId);
    const tokens = await this.tokenService.generateTokens(user);

    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }
}
