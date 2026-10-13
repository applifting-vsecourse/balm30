import {
  Poll,
  PollClosedError,
  PollNotAuthorError,
  PollNotFoundError,
  PollOptionNotFoundError,
  VoteChange,
} from '@/modules/quack/domain/poll';
import { PollRepository } from '@/modules/quack/repositories/poll.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

export const POLL_NOT_FOUND_MESSAGE = 'This poll does not exist';
export const POLL_CLOSED_MESSAGE = 'This poll is closed';
export const OPTION_NOT_IN_POLL_MESSAGE =
  'That answer is not part of this poll';
export const NOT_POLL_AUTHOR_MESSAGE = 'Only the author can close this poll';

const toHttpError = (error: unknown): unknown => {
  if (error instanceof PollNotFoundError) {
    return new NotFoundException(POLL_NOT_FOUND_MESSAGE);
  }
  if (error instanceof PollClosedError) {
    return new ConflictException(POLL_CLOSED_MESSAGE);
  }
  if (error instanceof PollOptionNotFoundError) {
    return new BadRequestException(OPTION_NOT_IN_POLL_MESSAGE);
  }
  if (error instanceof PollNotAuthorError) {
    return new ForbiddenException(NOT_POLL_AUTHOR_MESSAGE);
  }
  return error;
};

@Injectable()
export class PollsService {
  private readonly logger = new Logger(PollsService.name);

  constructor(private readonly pollRepository: PollRepository) {}

  async vote(user: Identity, pollId: string, optionId: string): Promise<Poll> {
    return this.applyVoteChange(pollId, user, () =>
      this.pollRepository.setVote(pollId, user.id, optionId),
    );
  }

  async removeVote(user: Identity, pollId: string): Promise<Poll> {
    return this.applyVoteChange(pollId, user, () =>
      this.pollRepository.removeVote(pollId, user.id),
    );
  }

  async closePoll(user: Identity, pollId: string): Promise<Poll> {
    try {
      await this.pollRepository.closePoll(pollId, user.id);
      return await this.pollRepository.getPoll(pollId, user.id);
    } catch (error) {
      throw toHttpError(error);
    }
  }

  private async applyVoteChange(
    pollId: string,
    user: Identity,
    change: () => Promise<VoteChange>,
  ): Promise<Poll> {
    try {
      const result = await change();
      if (result !== 'unchanged') {
        this.logger.log(`Poll vote poll=${pollId} change=${result}`);
      }
      return await this.pollRepository.getPoll(pollId, user.id);
    } catch (error) {
      throw toHttpError(error);
    }
  }
}
