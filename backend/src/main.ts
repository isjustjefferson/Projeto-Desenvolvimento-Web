import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Todos os endpoints ficam sob /api
  app.setGlobalPrefix('api');

  // Libera o frontend (Vite) consumir a API durante o desenvolvimento
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  // Validação global dos DTOs das requisições
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}/api`);
}
await bootstrap();