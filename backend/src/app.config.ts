import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

// Fotos chegam como data URL (base64), que é maior que o limite padrão
// do express.json (100kb). Usado tanto em main.ts quanto nos testes e2e.
const LIMITE_CORPO = '40mb';

export function configurarApp(app: NestExpressApplication): void {
  // Todos os endpoints ficam sob /api
  app.setGlobalPrefix('api');

  // O frontend usa /api na mesma origem. Formulários externos não conseguem enviar o cabeçalho.
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', 'no-store');
    const origemFetch = req.get('Sec-Fetch-Site');
    const leitura = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    const navegador = origemFetch !== undefined || req.get('Origin') !== undefined;
    if (!leitura && navegador && (
      (origemFetch !== undefined && origemFetch !== 'same-origin') ||
      req.get('X-Predial-Request') !== '1'
    )) {
      res.status(403).json({ message: 'Requisição recusada por origem inválida.' });
      return;
    }
    next();
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
