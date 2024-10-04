import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      omit: {
        hash: true,
        hashedRT: true,
      },
    });

    return users;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      omit: {
        hash: true,
        hashedRT: true,
      },
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    let user = null;
    user = await this.prisma.user
      .update({
        omit: {
          hash: true,
          hashedRT: true,
        },
        where: { id },
        data: { ...updateUserDto },
      })
      .catch(() => {
        throw new NotFoundException();
      });

    return user;
  }

  async remove(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException();
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
