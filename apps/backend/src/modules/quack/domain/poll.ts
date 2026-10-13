export const POLL_QUESTION_MAX_LENGTH = 140;
export const POLL_OPTION_MAX_LENGTH = 50;
export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 4;

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  closedAt: Date | null;
  options: PollOption[];
  totalVotes: number;
  myOptionId: string | null;
  canClose: boolean;
};

export type NewPoll = {
  question: string;
  options: string[];
};

export type VoteChange = 'cast' | 'moved' | 'removed' | 'unchanged';

export class PollNotFoundError extends Error {
  constructor(pollId: string) {
    super(`Poll ${pollId} does not exist`);
  }
}

export class PollClosedError extends Error {
  constructor(pollId: string) {
    super(`Poll ${pollId} is closed`);
  }
}

export class PollNotAuthorError extends Error {
  constructor(pollId: string) {
    super(`Only the author can close poll ${pollId}`);
  }
}

export class PollOptionNotFoundError extends Error {
  constructor(pollId: string, optionId: string) {
    super(`Option ${optionId} is not part of poll ${pollId}`);
  }
}
