import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma, User as PrismaUser } from '@/generated/prisma/client';
import { Profile, UsernameTakenError } from '@/modules/profile/domain/profile';
import { Injectable, NotFoundException } from '@nestjs/common';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

const mapPrismaUserToProfile = (user: PrismaUser): Profile => ({
  username: user.displayUsername ?? user.username ?? '',
  name: user.name,
  bio: user.bio,
  defaultMood: user.defaultMood,
});

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<Profile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException();
    }
    return mapPrismaUserToProfile(user);
  }

  async isUsernameTaken(
    username: string,
    exceptUserId: string,
  ): Promise<boolean> {
    const owner = await this.prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        NOT: { id: exceptUserId },
      },
      select: { id: true },
    });
    return owner !== null;
  }

  async updateProfile(userId: string, profile: Profile): Promise<Profile> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          username: profile.username.toLowerCase(),
          displayUsername: profile.username,
          name: profile.name,
          bio: profile.bio,
          defaultMood: profile.defaultMood,
          updatedAt: new Date(),
        },
      });
      return mapPrismaUserToProfile(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new UsernameTakenError(profile.username);
      }
      throw error;
    }
  }
}
