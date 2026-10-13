import { Profile, UsernameTakenError } from '@/modules/profile/domain/profile';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { ConflictException, Injectable } from '@nestjs/common';

export const USERNAME_TAKEN_MESSAGE = 'That username is already taken';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(user: Identity): Promise<Profile> {
    return this.profileRepository.getProfile(user.id);
  }

  async updateProfile(user: Identity, profile: Profile): Promise<Profile> {
    const normalized: Profile = {
      ...profile,
      bio: profile.bio || null,
    };

    if (
      await this.profileRepository.isUsernameTaken(normalized.username, user.id)
    ) {
      throw new ConflictException(USERNAME_TAKEN_MESSAGE);
    }

    try {
      return await this.profileRepository.updateProfile(user.id, normalized);
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        throw new ConflictException(USERNAME_TAKEN_MESSAGE);
      }
      throw error;
    }
  }
}
