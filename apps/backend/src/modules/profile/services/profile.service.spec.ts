import { Profile, UsernameTakenError } from '@/modules/profile/domain/profile';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { ConflictException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { ProfileService, USERNAME_TAKEN_MESSAGE } from './profile.service';

const user = { id: 'u1' } as Identity;

const aProfile = (overrides: Partial<Profile> = {}): Profile => ({
  username: 'CaffeinatedDuck',
  name: 'Caffeinated Duck',
  bio: null,
  defaultMood: null,
  ...overrides,
});

describe('ProfileService', () => {
  it("returns the signed-in user's profile", async () => {
    const profile = aProfile();
    const repository = mock<ProfileRepository>();
    repository.getProfile.mockResolvedValue(profile);

    const service = new ProfileService(repository);

    await expect(service.getProfile(user)).resolves.toEqual(profile);
    expect(repository.getProfile).toHaveBeenCalledWith('u1');
  });

  it('saves the profile of the signed-in user', async () => {
    const profile = aProfile({ bio: 'Runs on espresso', defaultMood: 'silly' });
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(false);
    repository.updateProfile.mockResolvedValue(profile);

    const service = new ProfileService(repository);

    await expect(service.updateProfile(user, profile)).resolves.toEqual(
      profile,
    );
    expect(repository.isUsernameTaken).toHaveBeenCalledWith(
      'CaffeinatedDuck',
      'u1',
    );
    expect(repository.updateProfile).toHaveBeenCalledWith('u1', profile);
  });

  it('stores an empty bio as no bio', async () => {
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(false);
    repository.updateProfile.mockResolvedValue(aProfile());

    const service = new ProfileService(repository);
    await service.updateProfile(user, aProfile({ bio: '' }));

    expect(repository.updateProfile).toHaveBeenCalledWith(
      'u1',
      aProfile({ bio: null }),
    );
  });

  it('rejects a username someone else already has', async () => {
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(true);

    const service = new ProfileService(repository);

    await expect(service.updateProfile(user, aProfile())).rejects.toEqual(
      new ConflictException(USERNAME_TAKEN_MESSAGE),
    );
    expect(repository.updateProfile).not.toHaveBeenCalled();
  });

  it('rejects a username taken between the check and the save', async () => {
    const repository = mock<ProfileRepository>();
    repository.isUsernameTaken.mockResolvedValue(false);
    repository.updateProfile.mockRejectedValue(
      new UsernameTakenError('CaffeinatedDuck'),
    );

    const service = new ProfileService(repository);

    await expect(service.updateProfile(user, aProfile())).rejects.toEqual(
      new ConflictException(USERNAME_TAKEN_MESSAGE),
    );
  });
});
