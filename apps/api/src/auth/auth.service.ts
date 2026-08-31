import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { LoginInput, SessionDto } from '@radar/contracts';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit() {
    const email = this.adminEmail();
    const password = this.adminPassword();
    const existing = await this.prisma.admin.findUnique({ where: { email } });
    if (existing && (await argon2.verify(existing.passwordHash, password))) return;

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await this.prisma.admin.upsert({
      where: { email },
      create: { email, passwordHash },
      update: { passwordHash },
    });
  }

  async login(input: LoginInput): Promise<{ token: string; session: SessionDto }> {
    if (input.email.trim().toLowerCase() !== this.adminEmail()) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }
    const admin = await this.prisma.admin.findUnique({ where: { email: input.email } });
    if (!admin || !(await argon2.verify(admin.passwordHash, input.password))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { adminId: admin.id, action: 'LOGIN', entity: 'Admin', entityId: admin.id },
    });

    return {
      token: await this.jwt.signAsync({ sub: admin.id, email: admin.email }),
      session: { email: admin.email },
    };
  }

  private adminEmail(): string {
    const value = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    if (!value) throw new Error('ADMIN_EMAIL não configurado.');
    return value;
  }

  private adminPassword(): string {
    const value = this.config.get<string>('ADMIN_PASSWORD');
    if (!value || value.length < 8) throw new Error('ADMIN_PASSWORD precisa ter ao menos 8 caracteres.');
    return value;
  }
}
