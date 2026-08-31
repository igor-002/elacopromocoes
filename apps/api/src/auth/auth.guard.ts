import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedRequest } from './auth.types';

const COOKIE_NAME = 'radar_session';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[COOKIE_NAME] as string | undefined;
    if (!token) throw new UnauthorizedException('Sessão ausente.');

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(token);
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true },
      });
      if (!admin || admin.email !== payload.email) throw new Error('Invalid subject');
      (request as AuthenticatedRequest).admin = admin;
      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
  }
}

export { COOKIE_NAME };
