import { Mood, Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, Logger } from '@nestjs/common';

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
    quackData: { text: string; mood?: Mood | null },
  ): Promise<Quack> {
    return this.quackRepository.createQuack({
      text: quackData.text,
      mood: quackData.mood ?? null,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
  }
}
