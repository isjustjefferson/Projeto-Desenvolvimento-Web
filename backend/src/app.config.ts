import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

// Fotos chegam como data URL (base64), que é maior que o limite padrão
// do express.json (100kb). Usado tanto em main.ts quanto nos testes e2e.
const LIMITE_CORPO = '10mb';

export function configurarApp(app: NestExpressApplication): void {
  // Todos os endpoints ficam sob /api
  app.setGlobalPrefix('api');

  // Libera o frontend (Vite) consumir a API durante o desenvolvimento
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  // Aceita payloads com fotos em base64
  app.useBodyParser('json', { limit: LIMITE_CORPO });
  app.useBodyParser('urlencoded', { extended: true, limit: LIMITE_CORPO });

  // Validação global dos DTOs das requisições
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
}
