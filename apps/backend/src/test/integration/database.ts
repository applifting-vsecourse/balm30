import { PrismaService } from '@/core/prisma/prisma.service';

export async function truncateAllTables(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const tableList = tables.map(({ tablename }) => `"${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE`);
}

export async function connectTestDatabase(): Promise<PrismaService> {
  const prisma = new PrismaService();
  await prisma.$connect();
  return prisma;
}
