export const POLL_QUESTION_MAX_LENGTH = 140;
export const POLL_OPTION_MAX_LENGTH = 50;
export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 4;

export type PollOption = {
  id: string;
  text: string;
};

export type Poll = {
  id: string;
  question: string;
  closedAt: Date | null;
  options: PollOption[];
};

export type NewPoll = {
  question: string;
  options: string[];
};
