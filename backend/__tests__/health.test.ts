import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /health', () => {
  it('returns ok status', async () => {
    process.env.NODE_ENV = 'test';
    const app = createApp();

    await request(app)
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(typeof res.body.uptime).toBe('number');
      });
  });
});
