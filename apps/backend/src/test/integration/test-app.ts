import { AppModule } from '@/app.module';
import { configureApp } from '@/configure-app';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Config } from '@/shared/config/config.service';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { truncateAllTables } from './database';

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
  await truncateAllTables(app.get(PrismaService));
}

export const aUser = (
  name: string,
): { name: string; email: string; password: string } => ({
  name,
  email: `${name.toLowerCase()}@example.com`,
  password: 'password1',
});

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

export async function makeAdmin(
  app: INestApplication,
  email: string,
): Promise<void> {
  await app.get(PrismaService).user.update({
    where: { email },
    data: { role: 'admin' },
  });
}
