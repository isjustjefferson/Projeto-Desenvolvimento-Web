import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { criarApp } from './helpers.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
    // Guarda contra bug no fluxo para o teste seguinte (seed é por instância)
  });

  it('login da Ana retorna usuário sem senha', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ana@predial.com', senha: '123456' })
      .expect(200);

    expect(res.body.ok).toBe(true);
    expect(res.body.usuario).toMatchObject({
      id: 1,
      email: 'ana@predial.com',
      role: 'SOLICITANTE',
    });
    expect(res.body.usuario.senha).toBeUndefined();
    expect(res.body.usuario.senhaHash).toBeUndefined();
  });

  it('senha incorreta retorna 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ana@predial.com', senha: 'errada' })
      .expect(401);
  });

  it('e-mail inexistente retorna 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nao@existe.com', senha: '123456' })
      .expect(401);
  });

  it('register cria conta SOLICITANTE e permite login', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nome: 'Maria Teste',
        email: 'maria@teste.com',
        unidade: 'Bloco C, Ap 10',
        senha: 'abcdef',
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'maria@teste.com', senha: 'abcdef' })
      .expect(200);
    expect(login.body.usuario.role).toBe('SOLICITANTE');
    expect(login.body.usuario.unidade).toBe('Bloco C, Ap 10');
  });

  it('register com e-mail duplicado retorna 409', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nome: 'Outro',
        email: 'ana@predial.com',
        unidade: 'Bloco A',
        senha: 'abcdef',
      })
      .expect(409);
  });

  it('senha curta no register retorna 400 (validação)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nome: 'Joana',
        email: 'joana@teste.com',
        unidade: 'Bloco A',
        senha: '123',
      })
      .expect(400);
  });

  it('forgot + reset altera a senha', async () => {
    const forgot = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'carlos@predial.com' })
      .expect(200);
    expect(forgot.body.token).toBeTruthy();

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: forgot.body.token, novaSenha: 'nova123' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'carlos@predial.com', senha: '123456' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'carlos@predial.com', senha: 'nova123' })
      .expect(200);
  });

  it('reset com token inválido retorna 400', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'token-invalido', novaSenha: 'nova123' })
      .expect(400);
  });

  it('GET /me sem x-usuario-id retorna 401', async () => {
    await request(app.getHttpServer()).get('/api/me').expect(401);
  });

  it('GET /me com header retorna o usuário', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/me')
      .set('x-usuario-id', '5')
      .expect(200);
    expect(res.body.usuario).toMatchObject({ id: 5, role: 'GESTOR' });
  });

  it('PATCH /me atualiza nome/foto', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/me')
      .set('x-usuario-id', '1')
      .send({ nome: 'Ana Souza Silva', foto: 'data:image/png;base64,abc' })
      .expect(200);
    expect(res.body.usuario.nome).toBe('Ana Souza Silva');
    expect(res.body.usuario.foto).toBe('data:image/png;base64,abc');
  });

  it('DELETE /me exclui a conta do usuário', async () => {
    await request(app.getHttpServer())
      .delete('/api/me')
      .set('x-usuario-id', '2')
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'carlos@predial.com', senha: '123456' })
      .expect(401);
  });
});