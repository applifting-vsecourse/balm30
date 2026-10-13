import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQuackDto } from './create-quack.dto';

const errorsFor = async (body: object): Promise<string[]> => {
  const errors = await validate(plainToInstance(CreateQuackDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const collect = (list: typeof errors): string[] =>
    list.flatMap((error) => [
      ...Object.values(error.constraints ?? {}),
      ...collect(error.children ?? []),
    ]);
  return collect(errors);
};

const poll = (overrides: object = {}): object => ({
  question: 'Where should we hold the picnic?',
  options: ['North end', 'West bank'],
  ...overrides,
});

describe('CreateQuackDto', () => {
  it('accepts a quack without a poll', async () => {
    await expect(errorsFor({ text: 'quack' })).resolves.toEqual([]);
  });

  it('accepts a poll with 2 to 4 answers and no text', async () => {
    await expect(errorsFor({ poll: poll() })).resolves.toEqual([]);
    await expect(
      errorsFor({ poll: poll({ options: ['a', 'b', 'c', 'd'] }) }),
    ).resolves.toEqual([]);
  });

  it('trims the question and the answers', () => {
    const dto = plainToInstance(CreateQuackDto, {
      poll: poll({ question: '  Lunch? ', options: [' Pizza ', 'Soup  '] }),
    });

    expect(dto.poll).toEqual({
      question: 'Lunch?',
      options: ['Pizza', 'Soup'],
    });
  });

  it.each([
    ['one answer', { options: ['Pizza'] }],
    ['five answers', { options: ['a', 'b', 'c', 'd', 'e'] }],
    ['an empty answer', { options: ['Pizza', '  '] }],
    ['an answer over 50 characters', { options: ['Pizza', 'x'.repeat(51)] }],
    ['the same answer twice ignoring case', { options: ['Pizza', ' pizza'] }],
    ['an empty question', { question: '   ' }],
    ['a question over 140 characters', { question: 'x'.repeat(141) }],
  ])('rejects a poll with %s', async (_case, overrides) => {
    const errors = await errorsFor({ poll: poll(overrides) });

    expect(errors).not.toEqual([]);
  });

  it('rejects text over 280 characters even with a poll', async () => {
    const errors = await errorsFor({ text: 'x'.repeat(281), poll: poll() });

    expect(errors).not.toEqual([]);
  });

  it('rejects unknown poll fields', async () => {
    const errors = await errorsFor({ poll: poll({ closedAt: '2026-01-01' }) });

    expect(errors).not.toEqual([]);
  });
});
