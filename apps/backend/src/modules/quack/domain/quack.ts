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

export type ReplyingTo = {
  quackId: string;
  username: string | null;
};

export type Quack = {
  id: string;
  text: string;
  mood: Mood | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  user?: QuackAuthor;
  poll: Poll | null;
  replyingTo: ReplyingTo | null;
  replyCount: number;
  canDelete: boolean;
};

export type QuackRecord = Omit<Quack, 'canDelete'>;

export type QuackThread<T extends QuackRecord = Quack> = {
  quack: T;
  replies: T[];
};

export type QuackFilter = {
  search?: string;
  authorId?: string;
};

export const isDeleted = (quack: Pick<QuackRecord, 'deletedAt'>): boolean =>
  quack.deletedAt !== null;

export const isWorthShowing = (
  quack: Pick<QuackRecord, 'deletedAt' | 'replyCount'>,
): boolean => !isDeleted(quack) || quack.replyCount > 0;

export const isQuackAuthor = (
  viewer: Pick<Identity, 'id'>,
  authorId: string,
): boolean => viewer.id === authorId;

export const canDeleteQuack = (
  viewer: Pick<Identity, 'id' | 'role'>,
  authorId: string,
): boolean => isQuackAuthor(viewer, authorId) || viewer.role === ADMIN_ROLE;
