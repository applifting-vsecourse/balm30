import * as request from 'supertest';
import { SignedInAgent } from './test-app';

type QuackJson = { id: string; [field: string]: unknown };

export async function postQuack(
  agent: SignedInAgent,
  text: string,
  parentId?: string,
): Promise<string> {
  const response = await agent
    .post('/api/quacks')
    .send({ text, ...(parentId ? { parentId } : {}) })
    .expect(201);
  return (response.body as QuackJson).id;
}

export const like = (agent: SignedInAgent, quackId: string): request.Test =>
  agent.post(`/api/quacks/${quackId}/like`);

export const unlike = (agent: SignedInAgent, quackId: string): request.Test =>
  agent.delete(`/api/quacks/${quackId}/like`);

export async function feedEntry(
  agent: SignedInAgent,
  quackId: string,
): Promise<QuackJson | undefined> {
  const response = await agent.get('/api/quacks').expect(200);
  return (response.body as QuackJson[]).find((quack) => quack.id === quackId);
}

export async function feedIds(
  agent: SignedInAgent,
  query: Record<string, string>,
): Promise<string[]> {
  const response = await agent.get('/api/quacks').query(query).expect(200);
  return (response.body as QuackJson[]).map((quack) => quack.id);
}
