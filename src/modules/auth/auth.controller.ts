import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser as CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import type { CurrentUser } from '../../common/interfaces/auth.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username and password' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@CurrentUserDecorator() user: CurrentUser) {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@CurrentUserDecorator() user: CurrentUser) {
    return this.authService.refreshTokens(user.id);
  }
}
