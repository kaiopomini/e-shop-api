import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, CreateUserDto } from './dto';
import * as argon2 from 'argon2';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException } from '@nestjs/common/exceptions';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signinLocal(dto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new ForbiddenException('Access Denied');
    }

    const passwordMatches = await argon2.verify(user.hash, dto.password);

    if (!passwordMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async signupLocal(createUserDto: CreateUserDto): Promise<Tokens> {
    const hasUser = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (hasUser) {
      throw new ForbiddenException('Access Denied');
    }

    const hash = await argon2.hash(createUserDto.password);
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        hash: hash,
      },
    });

    const tokens = await this.getTokens(newUser.id, newUser.email);

    await this.updateRefreshTokenHash(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRT: {
          not: null,
        },
      },
      data: {
        hashedRT: null,
      },
    });
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRT) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatchs = await argon2.verify(user.hashedRT, refreshToken);

    if (!refreshTokenMatchs) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async getTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.ACCESS_TOKEN_SECRET,
          expiresIn: '1d', // 1 dia
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.REFRESH_TOKEN_SECRET,
          expiresIn: '30d', // 7 dias
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRT: hash,
      },
    });
  }
}
