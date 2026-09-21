import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configurarApp } from './app.config.js';

async function bootstrap() {
  // bodyParser: false para registrar o parser com limite maior em configurarApp
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configurarApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}/api`);
}
await bootstrap();
