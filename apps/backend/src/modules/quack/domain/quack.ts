import { Poll } from '@/modules/quack/domain/poll';

export const QUACK_TEXT_MAX_LENGTH = 280;

export const MOODS = ['happy', 'sad', 'angry', 'silly'] as const;

export type Mood = (typeof MOODS)[number];

export type QuackAuthor = {
  id: string;
  name: string;
  username: string;
};

export type Quack = {
  id: string;
  text: string;
  mood: Mood | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: QuackAuthor;
  poll: Poll | null;
};
