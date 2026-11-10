import { NewPoll } from '@/modules/quack/domain/poll';
import {
  canDeleteQuack,
  isDeleted,
  isQuackAuthor,
  isWorthShowing,
  Mood,
  Quack,
  QuackRecord,
  QuackScope,
  QuackThread,
} from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

export const TEXT_OR_POLL_REQUIRED_MESSAGE =
  'A quack needs text unless it has a poll';
export const QUACK_NOT_FOUND_MESSAGE = 'This quack does not exist';
export const QUACK_DELETE_FORBIDDEN_MESSAGE =
  'Only the author or a moderator can delete this quack';

const withPermissionsFor =
  (viewer: Identity) =>
  (quack: QuackRecord): Quack => ({
    ...quack,
    canDelete: !isDeleted(quack) && canDeleteQuack(viewer, quack.userId),
  });

const normalizeSearch = (search?: string): string =>
  (search ?? '').trim().replace(/^@/, '').trim();

@Injectable()
export class QuacksService {
  private readonly logger = new Logger(QuacksService.name);

  constructor(private readonly quackRepository: QuackRepository) {}

  async getQuacks(
    viewer: Identity,
    { search, scope = 'all' }: { search?: string; scope?: QuackScope } = {},
  ): Promise<Quack[]> {
    const authorId = scope === 'mine' ? viewer.id : undefined;
    const term = normalizeSearch(search);
    if (!term) {
      const quacks = await this.quackRepository.getQuacks(viewer.id, {
        authorId,
      });
      return quacks.map(withPermissionsFor(viewer));
    }

    const quacks = await this.quackRepository.getQuacks(viewer.id, {
      search: term,
      authorId,
    });
    this.logger.log(
      `Quack search q=${JSON.stringify(term)} results=${quacks.length}`,
    );
    return quacks.map(withPermissionsFor(viewer));
  }

  async getQuackThread(
    viewer: Identity,
    quackId: string,
  ): Promise<QuackThread> {
    const thread = await this.quackRepository.getQuackThread(
      viewer.id,
      quackId,
    );
    if (!thread || !isWorthShowing(thread.quack)) {
      throw new NotFoundException(QUACK_NOT_FOUND_MESSAGE);
    }
    return {
      quack: withPermissionsFor(viewer)(thread.quack),
      replies: thread.replies.map(withPermissionsFor(viewer)),
    };
  }

  async createQuack(
    user: Identity,
    quackData: {
      text?: string;
      mood?: Mood | null;
      poll?: NewPoll | null;
      parentId?: string | null;
    },
  ): Promise<Quack> {
    const text = quackData.text ?? '';
    const poll = quackData.poll ?? null;
    const parentId = quackData.parentId ?? null;
    if (!text.trim() && !poll) {
      throw new BadRequestException(TEXT_OR_POLL_REQUIRED_MESSAGE);
    }
    if (parentId && !(await this.quackRepository.isNotDeleted(parentId))) {
      throw new NotFoundException(QUACK_NOT_FOUND_MESSAGE);
    }

    const quack = await this.quackRepository.createQuack({
      text,
      mood: quackData.mood ?? null,
      // the author is taken from the session, never from the request body
      userId: user.id,
      poll,
      parentId,
    });

    if (quack.poll) {
      this.logger.log(
        `Poll created poll=${quack.poll.id} options=${quack.poll.options.length}`,
      );
    }
    return withPermissionsFor(user)(quack);
  }

  async deleteQuack(user: Identity, quackId: string): Promise<void> {
    const authorId = await this.quackRepository.getAuthorId(quackId);
    if (!authorId) {
      throw new NotFoundException(QUACK_NOT_FOUND_MESSAGE);
    }
    if (!canDeleteQuack(user, authorId)) {
      throw new ForbiddenException(QUACK_DELETE_FORBIDDEN_MESSAGE);
    }

    await this.quackRepository.deleteQuack(quackId);
    const deletedBy = isQuackAuthor(user, authorId) ? 'author' : 'moderator';
    this.logger.log(`Quack deleted quack=${quackId} by=${deletedBy}`);
  }
}
