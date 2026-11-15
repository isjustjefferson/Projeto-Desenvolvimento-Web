import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from './helpers.js';

describe('Health (e2e)', () => {
  it('GET /api/health responde com status ok', async () => {
    const app = await criarApp();
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    await app.close();
  });
});