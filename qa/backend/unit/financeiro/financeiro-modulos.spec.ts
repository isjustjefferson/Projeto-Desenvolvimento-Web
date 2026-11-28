import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Express } from 'express';
import { describe, expect, it } from 'vitest';
import { configurarApp } from '../../../../backend/src/app.config.js';
import { AppModule, ChamadosAppModule } from '../../../../backend/src/app.module.js';
import { FinanceiroAppModule } from '../../../../backend/src/financeiro/financeiro.module.js';

describe('módulos de execução', () => {
  it.each([
    { modulo: AppModule, temLogin: true, temFinanceiro: true },
    { modulo: ChamadosAppModule, temLogin: true, temFinanceiro: false },
    { modulo: FinanceiroAppModule, temLogin: false, temFinanceiro: true },
  ])('$modulo disponibiliza somente as suas rotas', async ({ modulo, temLogin, temFinanceiro }) => {
    const app = await NestFactory.create<NestExpressApplication>(modulo, {
      bodyParser: false,
      logger: false,
      abortOnError: false,
    });
    try {
      configurarApp(app);
      await app.init();
      const express: Express = app.getHttpAdapter().getInstance();
      const rotas = express.router.stack.map((camada) => camada.route?.path);
      expect(rotas).toContain('/api/health');
      expect(rotas.includes('/api/auth/login')).toBe(temLogin);
      expect(rotas.includes('/api/relatorios/despesas')).toBe(temFinanceiro);
      expect(rotas.includes('/api/fiscal/trabalhos/reservar')).toBe(temFinanceiro);
    } finally {
      await app.close();
    }
  });
});
