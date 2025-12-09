import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { JwtPayload, AuthTokens } from '../../../common/interfaces/auth.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = this.buildPayload(user);
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(payload),
      this.signRefreshToken(payload),
    ]);

    return {
      access_token,
      refresh_token,
      expires_in: this.getAccessTokenExpiry(),
    };
  }

  private buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  private signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: this.getAccessTokenExpiry(),
    });
  }

  private signRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: this.getRefreshTokenExpiry(),
    });
  }

  private getAccessTokenSecret(): string {
    return this.configService.get<string>('jwt.secret') || 'default-secret';
  }

  private getRefreshTokenSecret(): string {
    return this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret';
  }

  private getAccessTokenExpiry(): number {
    return parseInt(this.configService.get<string>('jwt.expiresIn') || '3600', 10);
  }

  private getRefreshTokenExpiry(): number {
    return parseInt(this.configService.get<string>('jwt.refreshExpiresIn') || '604800', 10);
  }
}
