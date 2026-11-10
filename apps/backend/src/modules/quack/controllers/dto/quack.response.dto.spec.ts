import { Quack } from '@/modules/quack/domain/quack';
import { QuackResponseDto } from './quack.response.dto';

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'quack quack',
  mood: 'happy',
  userId: 'u1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  deletedAt: null,
  user: { id: 'u1', name: 'Caffeinated Duck', username: 'CaffeinatedDuck' },
  poll: null,
  replyingTo: { quackId: 'q0', username: 'BreadCritic' },
  replyCount: 2,
  canDelete: true,
  ...overrides,
});

describe('QuackResponseDto', () => {
  it('returns the author and content of a quack that is not deleted', () => {
    const dto = QuackResponseDto.fromDomain(aQuack());

    expect(dto).toMatchObject({
      text: 'quack quack',
      mood: 'happy',
      userId: 'u1',
      user: { username: 'CaffeinatedDuck' },
      isDeleted: false,
      replyCount: 2,
    });
  });

  it('returns nothing about the author or content of a deleted quack', () => {
    const dto = QuackResponseDto.fromDomain(
      aQuack({ deletedAt: new Date('2026-01-02T12:00:00Z') }),
    );

    expect(dto).toEqual({
      id: 'q1',
      createdAt: new Date('2026-01-01T12:00:00Z'),
      text: '',
      mood: null,
      userId: null,
      user: null,
      poll: null,
      isDeleted: true,
      replyingTo: { quackId: 'q0', username: 'BreadCritic' },
      replyCount: 2,
      canDelete: false,
    });
  });
});
