import { like, postQuack } from '@/test/integration/quack-api';
import {
  aUser,
  createTestApp,
  makeAdmin,
  resetDatabase,
  signUp,
} from '@/test/integration/test-app';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('GET /api/stats likes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('A15: counts likes on live quacks for the admin only', async () => {
    const alice = await signUp(app, aUser('Alice'));
    const bob = await signUp(app, aUser('Bob'));
    const admin = await signUp(app, aUser('Admin'));
    await makeAdmin(app, aUser('Admin').email);
    const live = await postQuack(alice, 'Stays');
    const doomed = await postQuack(alice, 'Goes');
    await postQuack(bob, 'Keeps the deleted quack around', doomed);
    await like(bob, live).expect(200);
    await like(admin, live).expect(200);
    await like(bob, doomed).expect(200);
    await alice.delete(`/api/quacks/${doomed}`).expect(204);

    const response = await admin.get('/api/stats').expect(200);

    expect(response.body).toMatchObject({ likes: 2, recentLikes: 2 });
    await bob.get('/api/stats').expect(403);
    await request(app.getHttpServer()).get('/api/stats').expect(401);
  });
});
