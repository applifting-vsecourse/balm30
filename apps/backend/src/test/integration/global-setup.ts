import { execSync } from 'child_process';
import * as path from 'path';
import { useTestDatabase } from './test-database-url';

export default function globalSetup(): void {
  useTestDatabase();
  execSync('pnpm exec prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../../..'),
    env: process.env,
    stdio: 'inherit',
  });
}
