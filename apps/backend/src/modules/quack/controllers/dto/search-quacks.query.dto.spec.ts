import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchQuacksQueryDto } from './search-quacks.query.dto';

const errorsFor = async (query: object): Promise<string[]> => {
  const errors = await validate(plainToInstance(SearchQuacksQueryDto, query), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
};

describe('SearchQuacksQueryDto', () => {
  it.each([{}, { scope: 'all' }, { scope: 'mine', q: 'pond' }])(
    'accepts %j',
    async (query) => {
      await expect(errorsFor(query)).resolves.toEqual([]);
    },
  );

  it.each(['theirs', 'MINE', ''])('rejects the scope %j', async (scope) => {
    await expect(errorsFor({ scope })).resolves.toHaveLength(1);
  });
});
