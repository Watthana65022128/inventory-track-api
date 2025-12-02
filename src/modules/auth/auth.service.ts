import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import {
  LoginResponse,
  JwtPayload,
  AuthTokens,
} from '../../common/interfaces/auth.interface';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const tokens = await this.generateTokens(user);

    // Save refresh token to database
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
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
    return this.login(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string): Promise<AuthTokens> {
    const user = await this.usersService.findOne(userId);
    const tokens = await this.generateTokens(user);

    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const secret = this.configService.get<string>('jwt.secret') || 'default-secret';
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret';
    const expiresIn = parseInt(this.configService.get<string>('jwt.expiresIn') || '3600', 10);
    const refreshExpiresIn = parseInt(this.configService.get<string>('jwt.refreshExpiresIn') || '604800', 10);

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      access_token,
      refresh_token,
      expires_in: expiresIn,
    };
  }
}
