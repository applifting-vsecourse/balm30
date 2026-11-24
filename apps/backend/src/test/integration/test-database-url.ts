import * as path from 'path';
import * as dotenv from 'dotenv';

const LOCAL_TEST_DATABASE_URL =
  'postgresql://quacker:quacker@localhost:5433/quacker_test';

export function useTestDatabase(): string {
  dotenv.config({
    path: path.resolve(__dirname, '../../../.env'),
    quiet: true,
  });

  const url = process.env.TEST_DATABASE_URL ?? LOCAL_TEST_DATABASE_URL;
  const databaseName = new URL(url).pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Integration tests wipe their database, so its name must end with "_test". Got "${databaseName}".`,
    );
  }

  process.env.DATABASE_URL = url;
  return url;
}
