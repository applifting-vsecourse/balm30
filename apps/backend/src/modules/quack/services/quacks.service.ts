import { NewPoll } from '@/modules/quack/domain/poll';
import { Mood, Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

export const TEXT_OR_POLL_REQUIRED_MESSAGE =
  'A quack needs text unless it has a poll';

const normalizeSearch = (search?: string): string =>
  (search ?? '').trim().replace(/^@/, '').trim();

@Injectable()
export class QuacksService {
  private readonly logger = new Logger(QuacksService.name);

  constructor(private readonly quackRepository: QuackRepository) {}

  async getQuacks(search?: string): Promise<Quack[]> {
    const term = normalizeSearch(search);
    if (!term) {
      return this.quackRepository.getQuacks();
    }

    const quacks = await this.quackRepository.getQuacks(term);
    this.logger.log(
      `Quack search q=${JSON.stringify(term)} results=${quacks.length}`,
    );
    return quacks;
  }

  async createQuack(
    user: Identity,
    quackData: { text?: string; mood?: Mood | null; poll?: NewPoll | null },
  ): Promise<Quack> {
    const text = quackData.text ?? '';
    const poll = quackData.poll ?? null;
    if (!text.trim() && !poll) {
      throw new BadRequestException(TEXT_OR_POLL_REQUIRED_MESSAGE);
    }

    const quack = await this.quackRepository.createQuack({
      text,
      mood: quackData.mood ?? null,
      // the author is taken from the session, never from the request body
      userId: user.id,
      poll,
    });

    if (quack.poll) {
      this.logger.log(
        `Poll created poll=${quack.poll.id} options=${quack.poll.options.length}`,
      );
    }
    return quack;
  }
}
