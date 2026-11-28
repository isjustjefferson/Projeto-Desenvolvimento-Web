import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { cookieDeUsuario, criarApp, type App } from './helpers.js';

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
    expect(res.headers['set-cookie'][0]).toMatch(/predial_sessao=.*Path=\/api.*HttpOnly.*SameSite=Strict/);
    expect(res.body.usuario).toMatchObject({
      id: 1,
      email: 'ana@predial.com',
      role: 'CONDOMINO',
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

  it('register cria conta CONDOMINO e permite login', async () => {
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
    expect(login.body.usuario.role).toBe('CONDOMINO');
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

  it('recuperação pública não entrega nem aceita tokens', async () => {
    for (const email of ['carlos@predial.com', 'nao@existe.com']) {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(503);
      expect(res.body.token).toBeUndefined();
    }
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: 'token-antigo', novaSenha: 'nova123' })
      .expect(503);
  });

  it('GET /me rejeita somente o identificador enviado pelo cliente', async () => {
    await request(app.getHttpServer()).get('/api/me').set('x-usuario-id', '6').expect(401);
  });

  it('GET /me usa o cookie de sessão, mesmo com outro id no cabeçalho', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', await cookieDeUsuario(app, 1))
      .set('x-usuario-id', '6')
      .expect(200);
    expect(res.body.usuario).toMatchObject({ id: 1, role: 'CONDOMINO' });
  });

  it('logout revoga o cookie e impede sua reutilização', async () => {
    const cookie = await cookieDeUsuario(app, 1);
    const res = await request(app.getHttpServer()).post('/api/auth/logout').set('Cookie', cookie).expect(204);
    expect(res.headers['set-cookie'][0]).toContain('predial_sessao=;');
    await request(app.getHttpServer()).get('/api/me').set('Cookie', cookie).expect(401);
  });

  it('recusa sair por uma origem externa, mesmo com cookie', async () => {
    const cookie = await cookieDeUsuario(app, 1);
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set('Origin', 'https://outra.example')
      .set('Sec-Fetch-Site', 'cross-site')
      .expect(403);
    await request(app.getHttpServer()).get('/api/me').set('Cookie', cookie).expect(200);
  });

  it('PATCH /me atualiza nome/foto', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/me')
      .set('Cookie', await cookieDeUsuario(app, 1))
      .send({ nome: 'Ana Souza Silva', foto: 'data:image/png;base64,abc' })
      .expect(200);
    expect(res.body.usuario.nome).toBe('Ana Souza Silva');
    expect(res.body.usuario.foto).toBe('data:image/png;base64,abc');
  });

  it('DELETE /me exclui a conta do usuário', async () => {
    await request(app.getHttpServer())
      .delete('/api/me')
      .set('Cookie', await cookieDeUsuario(app, 2))
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'carlos@predial.com', senha: '123456' })
      .expect(401);
  });
});