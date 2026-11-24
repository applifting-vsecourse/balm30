import {
  feedEntry,
  like,
  postQuack,
  unlike,
} from '@/test/integration/quack-api';
import {
  aUser,
  createTestApp,
  resetDatabase,
  SignedInAgent,
  signUp,
} from '@/test/integration/test-app';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Likes API', () => {
  let app: INestApplication;
  let alice: SignedInAgent;
  let bob: SignedInAgent;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    alice = await signUp(app, aUser('Alice'));
    bob = await signUp(app, aUser('Bob'));
  });

  afterAll(async () => {
    await app.close();
  });

  it('A1: a signed-out visitor gets 401 and the count stays', async () => {
    const quackId = await postQuack(
      bob,
      'Signed-out visitors look but do not like',
    );
    const visitor = request(app.getHttpServer());

    await visitor.post(`/api/quacks/${quackId}/like`).expect(401);
    await visitor.delete(`/api/quacks/${quackId}/like`).expect(401);

    expect(await feedEntry(bob, quackId)).toMatchObject({ likeCount: 0 });
  });

  it("A2: liking someone else's quack returns the new count", async () => {
    const quackId = await postQuack(bob, 'Like me');

    const response = await like(alice, quackId).expect(200);

    expect(response.body).toEqual({ likeCount: 1, likedByMe: true });
  });

  it('A3: the feed shows the count to everyone and likedByMe per viewer', async () => {
    const quackId = await postQuack(bob, 'Liked by Alice');
    await like(alice, quackId).expect(200);

    expect(await feedEntry(alice, quackId)).toMatchObject({
      likeCount: 1,
      likedByMe: true,
    });
    expect(await feedEntry(bob, quackId)).toMatchObject({
      likeCount: 1,
      likedByMe: false,
    });
  });

  it('A4: liking twice keeps the count at 1', async () => {
    const quackId = await postQuack(bob, 'Like me twice');
    await like(alice, quackId).expect(200);

    const response = await like(alice, quackId).expect(200);

    expect(response.body).toEqual({ likeCount: 1, likedByMe: true });
  });

  it('A5: unliking takes the like back', async () => {
    const quackId = await postQuack(bob, 'Like me, then do not');
    await like(alice, quackId).expect(200);

    const response = await unlike(alice, quackId).expect(200);

    expect(response.body).toEqual({ likeCount: 0, likedByMe: false });
  });

  it("A6: unliking without a like changes nothing, and keeps others' likes", async () => {
    const quackId = await postQuack(alice, 'Bob likes this');
    await like(bob, quackId).expect(200);
    const carol = await signUp(app, aUser('Carol'));

    const response = await unlike(carol, quackId).expect(200);

    expect(response.body).toEqual({ likeCount: 1, likedByMe: false });
  });

  it('A7: two likes at once from one user count once', async () => {
    const quackId = await postQuack(bob, 'Double click');

    const responses = await Promise.all([
      like(alice, quackId),
      like(alice, quackId),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await feedEntry(alice, quackId)).toMatchObject({
      likeCount: 1,
      likedByMe: true,
    });
  });

  it('A8: the author can like their own quack', async () => {
    const quackId = await postQuack(alice, 'I like my own quack');

    const response = await like(alice, quackId).expect(200);

    expect(response.body).toEqual({ likeCount: 1, likedByMe: true });
  });

  it('A9: a deleted quack refuses likes and shows none', async () => {
    const quackId = await postQuack(alice, 'Soon gone');
    await postQuack(bob, 'A reply that keeps it around', quackId);
    await like(bob, quackId).expect(200);
    await alice.delete(`/api/quacks/${quackId}`).expect(204);

    await like(bob, quackId).expect(404);
    await unlike(bob, quackId).expect(404);

    const thread = await bob.get(`/api/quacks/${quackId}`).expect(200);
    expect(thread.body.quack).toMatchObject({
      isDeleted: true,
      likeCount: null,
      likedByMe: null,
    });
  });

  it("A10: liking a quack that doesn't exist gets 404", async () => {
    await like(alice, 'does-not-exist').expect(404);
  });

  it('A11: replies can be liked and keep their own count', async () => {
    const quackId = await postQuack(alice, 'Parent');
    const replyId = await postQuack(bob, 'Reply', quackId);

    await like(alice, replyId).expect(200);

    const thread = await alice.get(`/api/quacks/${quackId}`).expect(200);
    expect(thread.body.quack).toMatchObject({ likeCount: 0 });
    expect(thread.body.replies).toEqual([
      expect.objectContaining({ id: replyId, likeCount: 1, likedByMe: true }),
    ]);
  });
});
