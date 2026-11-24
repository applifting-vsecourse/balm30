import { feedIds, like, postQuack } from '@/test/integration/quack-api';
import {
  aUser,
  createTestApp,
  resetDatabase,
  SignedInAgent,
  signUp,
} from '@/test/integration/test-app';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('GET /api/quacks', () => {
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

  it('turns away a signed-out visitor with 401', async () => {
    await request(app.getHttpServer()).get('/api/quacks').expect(401);
  });

  it('returns the feed to a signed-in user', async () => {
    const agent = await signUp(app);

    const response = await agent.get('/api/quacks').expect(200);

    expect(response.body).toEqual([]);
  });
});

describe('GET /api/quacks sorted by likes', () => {
  let app: INestApplication;
  let alice: SignedInAgent;
  let bob: SignedInAgent;
  let carol: SignedInAgent;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    alice = await signUp(app, aUser('Alice'));
    bob = await signUp(app, aUser('Bob'));
    carol = await signUp(app, aUser('Carol'));
  });

  afterAll(async () => {
    await app.close();
  });

  it('A12: returns the most liked quacks first', async () => {
    const none = await postQuack(alice, 'No likes');
    const two = await postQuack(alice, 'Two likes');
    const one = await postQuack(alice, 'One like');
    await like(bob, two).expect(200);
    await like(carol, two).expect(200);
    await like(bob, one).expect(200);

    expect(await feedIds(alice, { sort: 'likes' })).toEqual([two, one, none]);
  });

  it('A13: sorting combines with search and "mine"', async () => {
    const olderLiked = await postQuack(alice, 'pond one');
    const newerNotLiked = await postQuack(alice, 'pond two');
    await postQuack(alice, 'something else');
    const bobsPond = await postQuack(bob, 'pond by Bob');
    await like(bob, olderLiked).expect(200);
    await like(carol, bobsPond).expect(200);
    await like(alice, bobsPond).expect(200);

    expect(
      await feedIds(alice, { sort: 'likes', scope: 'mine', q: 'pond' }),
    ).toEqual([olderLiked, newerNotLiked]);
  });

  it('A14: refuses an unknown sort with 400', async () => {
    const response = await alice
      .get('/api/quacks')
      .query({ sort: 'popular' })
      .expect(400);

    expect(response.body.message).toEqual([
      expect.stringContaining('sort must be one of the following values'),
    ]);
  });
});
