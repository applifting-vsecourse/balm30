import { Poll } from '@/modules/quack/domain/poll';
import { ADMIN_ROLE, Identity } from '@/shared/auth/domain/identity';

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

export type QuackRecord = Omit<Quack, 'canDelete'>;

export type QuackFilter = {
  search?: string;
  authorId?: string;
};

export const isQuackAuthor = (
  viewer: Pick<Identity, 'id'>,
  authorId: string,
): boolean => viewer.id === authorId;

export const canDeleteQuack = (
  viewer: Pick<Identity, 'id' | 'role'>,
  authorId: string,
): boolean => isQuackAuthor(viewer, authorId) || viewer.role === ADMIN_ROLE;
