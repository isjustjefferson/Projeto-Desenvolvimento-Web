import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import supertest from 'supertest';
import { AppModule } from '../../../backend/src/app.module.js';
import { configurarApp } from '../../../backend/src/app.config.js';
import { usuariosSeed } from '../../../backend/src/dados/seed.js';

export type App = Parameters<typeof supertest>[0];

const cookiesPorApp = new WeakMap<INestApplication<App>, Map<number, Promise<string>>>();

export async function cookieDeUsuario(app: INestApplication<App>, id: number): Promise<string> {
  let cookies = cookiesPorApp.get(app);
  if (!cookies) {
    cookies = new Map();
    cookiesPorApp.set(app, cookies);
  }
  const existente = cookies.get(id);
  if (existente) return existente;

  const usuario = usuariosSeed.find((candidato) => candidato.id === id);
  if (!usuario) throw new Error(`Usuário de teste ${id} não encontrado.`);
  const login = supertest(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: usuario.email, senha: '123456' })
    .expect(200)
    .then((res) => (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0]);
  cookies.set(id, login);
  return login;
}

export async function criarApp(): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app =
    moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
  configurarApp(app);
  await app.init();
  return app;
}
