import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';


@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) { }

  async register(email: string, password: string) {
    // Email'in kullanılıp kullanılmadığını kontrol et
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Şifreyi hash'le
    const passwordHash = await argon.hash(password);

    // Kullanıcıyı oluştur
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // JWT token oluştur
    const payload = { sub: user.id, role: 'admin', email: user.email };
    const access_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ADMIN_SECRET,
      expiresIn: process.env.JWT_EXP_ADMIN || '15m',
      algorithm: 'HS256'
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: 'admin'
      }
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await argon.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, role: 'admin', email: user.email };
    const access_token = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ADMIN_SECRET,
      expiresIn: process.env.JWT_EXP_ADMIN || '15m',
      algorithm: 'HS256'
    });
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: 'admin'
      }
    };
  }

  async logout() {
    // Client tarafında token'ı silmesi gerekiyor
    // Server-side'da stateless JWT kullanıldığı için özel bir işlem gerekmiyor
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      role: 'admin'
    };
  }

  async signTeamToken(teamId: string, sessionId: string) {
    const payload = { sub: `team:${teamId}`, role: 'team', teamId, sessionId };
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_TEAM_SECRET,
      expiresIn: process.env.JWT_EXP_TEAM || '60m',
      algorithm: 'HS256'
    });
  }
}
