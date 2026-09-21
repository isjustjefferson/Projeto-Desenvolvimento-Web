import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { criarApp } from './helpers.js';

describe('Usuários (admin) (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /usuarios sem header retorna 401', async () => {
    await request(app.getHttpServer()).get('/api/usuarios').expect(401);
  });

  it('GET /usuarios para não-admin retorna 403', async () => {
    await request(app.getHttpServer())
      .get('/api/usuarios')
      .set('x-usuario-id', '1')
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/usuarios')
      .set('x-usuario-id', '5')
      .expect(403);
  });

  it('GET /usuarios para admin lista usuários sem senha', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/usuarios')
      .set('x-usuario-id', '6')
      .expect(200);
    expect(res.body.usuarios).toHaveLength(6);
    expect(res.body.usuarios[0]).not.toHaveProperty('senha');
    expect(res.body.usuarios[0]).not.toHaveProperty('senhaHash');
  });

  it('POST cria TECNICO com especialidade e login com senha padrão', async () => {
    const criar = await request(app.getHttpServer())
      .post('/api/usuarios')
      .set('x-usuario-id', '6')
      .send({
        nome: 'Fábio Manutenção',
        email: 'fabio@predial.com',
        role: 'TECNICO',
        especialidade: 'Climatização',
      })
      .expect(201);
    expect(criar.body.usuario).toMatchObject({
      id: 7,
      role: 'TECNICO',
      especialidade: 'Climatização',
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'fabio@predial.com', senha: '123456' })
      .expect(200);
    expect(login.body.usuario.role).toBe('TECNICO');
  });

  it('POST com e-mail duplicado retorna 409', async () => {
    await request(app.getHttpServer())
      .post('/api/usuarios')
      .set('x-usuario-id', '6')
      .send({ nome: 'Duplicado', email: 'ana@predial.com' })
      .expect(409);
  });

  it('POST com role inválida retorna 400', async () => {
    await request(app.getHttpServer())
      .post('/api/usuarios')
      .set('x-usuario-id', '6')
      .send({ nome: 'X', email: 'x@predial.com', role: 'SUPER' })
      .expect(400);
  });

  it('PATCH promove para GESTOR e rebaixa para SOLICITANTE', async () => {
    await request(app.getHttpServer())
      .patch('/api/usuarios/1/role')
      .set('x-usuario-id', '6')
      .send({ role: 'GESTOR' })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ana@predial.com', senha: '123456' })
      .expect(200);
    expect(login.body.usuario.role).toBe('GESTOR');

    const rebaixa = await request(app.getHttpServer())
      .patch('/api/usuarios/1/role')
      .set('x-usuario-id', '6')
      .send({ role: 'SOLICITANTE' })
      .expect(200);
    expect(rebaixa.body.usuario.role).toBe('SOLICITANTE');
  });

  it('PATCH com role inválida retorna 400', async () => {
    await request(app.getHttpServer())
      .patch('/api/usuarios/1/role')
      .set('x-usuario-id', '6')
      .send({ role: 'INEXISTENTE' })
      .expect(400);
  });

  it('PATCH/DELETE em id inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .patch('/api/usuarios/999/role')
      .set('x-usuario-id', '6')
      .send({ role: 'GESTOR' })
      .expect(404);
    await request(app.getHttpServer())
      .delete('/api/usuarios/999')
      .set('x-usuario-id', '6')
      .expect(404);
  });

  it('PATCH/DELETE sobre a própria conta retorna 400', async () => {
    await request(app.getHttpServer())
      .patch('/api/usuarios/6/role')
      .set('x-usuario-id', '6')
      .send({ role: 'GESTOR' })
      .expect(400);
    await request(app.getHttpServer())
      .delete('/api/usuarios/6')
      .set('x-usuario-id', '6')
      .expect(400);
  });

  it('DELETE exclui a conta e o login passa a falhar', async () => {
    await request(app.getHttpServer())
      .delete('/api/usuarios/2')
      .set('x-usuario-id', '6')
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'carlos@predial.com', senha: '123456' })
      .expect(401);
  });
});