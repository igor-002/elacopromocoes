import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { loginSchema, type SessionDto } from '@radar/contracts';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { parseWith } from '../common/zod';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { COOKIE_NAME } from './auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(parseWith(loginSchema, body));
    response.cookie(COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/',
    });
    return result.session;
  }

  @Get('session')
  session(@Req() request: AuthenticatedRequest): SessionDto {
    return { email: request.admin.email };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'strict',
      path: '/',
    });
    return { ok: true };
  }

  private isSecureCookie(): boolean {
    return this.config.get<string>('APP_URL')?.trim().toLowerCase().startsWith('https://') ?? false;
  }
}
