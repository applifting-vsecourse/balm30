import { AppModule } from '@/app.module';
import { configureApp } from '@/configure-app';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Config } from '@/shared/config/config.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';

export type SignedInAgent = TestAgent;

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('EmailService')
    .useValue({ sendEmail: async () => undefined })
    .compile();
  const app = moduleRef.createNestApplication({ logger: ['error'] });
  configureApp(app);
  await app.init();
  return app;
}

export async function resetDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;
  const tableList = tables.map(({ tablename }) => `"${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE`);
}

export async function signUp(
  app: INestApplication,
  user = {
    name: 'Test Duck',
    email: 'test.duck@example.com',
    password: 'password1',
  },
): Promise<SignedInAgent> {
  const agent = request.agent(app.getHttpServer());
  await agent
    .post('/api/auth/sign-up/email')
    .set('Origin', app.get(Config).frontendUrl)
    .send(user)
    .expect(200);
  return agent;
}
