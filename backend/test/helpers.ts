import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.config.js';

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
