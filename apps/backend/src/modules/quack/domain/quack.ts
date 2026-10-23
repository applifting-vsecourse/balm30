import { Poll } from '@/modules/quack/domain/poll';

export const QUACK_TEXT_MAX_LENGTH = 280;

export const MOODS = ['happy', 'sad', 'angry', 'silly'] as const;

export type Mood = (typeof MOODS)[number];

export const QUACK_SCOPES = ['all', 'mine'] as const;

export type QuackScope = (typeof QUACK_SCOPES)[number];

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
  canDelete: boolean;
};

export type QuackFilter = {
  search?: string;
  authorId?: string;
};

export class QuackNotFoundError extends Error {
  constructor(quackId: string) {
    super(`Quack ${quackId} does not exist`);
  }
}

export class QuackNotAuthorError extends Error {
  constructor(quackId: string) {
    super(`Only the author can delete quack ${quackId}`);
  }
}
