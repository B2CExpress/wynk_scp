import request from 'supertest';
import { createApp } from '../src/app';
import { makeAppDeps } from './helpers/mock-deps';

describe('GET /health', () => {
  it('returns ok status without going through tenant resolution', async () => {
    process.env.NODE_ENV = 'test';
    const app = createApp(makeAppDeps());

    await request(app)
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(typeof res.body.uptime).toBe('number');
      });
  });
});
