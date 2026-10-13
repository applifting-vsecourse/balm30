import { Mood } from '@/modules/quack/domain/quack';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;
export const NAME_MAX_LENGTH = 50;
export const BIO_MAX_LENGTH = 160;

export type Profile = {
  username: string;
  name: string;
  bio: string | null;
  defaultMood: Mood | null;
};

export class UsernameTakenError extends Error {
  constructor(username: string) {
    super(`Username "${username}" is already taken`);
  }
}
