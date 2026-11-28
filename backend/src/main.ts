import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ChamadosAppModule } from './app.module.js';
import { configurarApp } from './app.config.js';
import { FinanceiroAppModule } from './financeiro/financeiro.module.js';
import { autenticarChamados, encaminharFinanceiro } from './financeiro/financeiro-http.js';
import { SessoesService } from './auth/sessoes.service.js';

async function bootstrap() {
  const modoFinanceiro = process.env.APP_SERVICE === 'financeiro';
  const financeiroUrl = process.env.FINANCEIRO_URL;
  const token = process.env.FINANCEIRO_TOKEN;
  if ((modoFinanceiro || financeiroUrl) && !token?.trim()) {
    throw new Error('FINANCEIRO_TOKEN é obrigatório quando financeiro roda em separado.');
  }
  const modulo = modoFinanceiro ? FinanceiroAppModule
    : financeiroUrl ? ChamadosAppModule
    : AppModule;

  // bodyParser: false para registrar o parser com limite maior em configurarApp
  const app = await NestFactory.create<NestExpressApplication>(modulo, {
    bodyParser: false,
  });
  if (modoFinanceiro && token) app.use(autenticarChamados(token));
  configurarApp(app);
  if (!modoFinanceiro && financeiroUrl && token) {
    const sessoes = app.get(SessoesService);
    app.use(encaminharFinanceiro(financeiroUrl, token, async (sessao) =>
      !!(await sessoes.usuarioDaSessao(sessao)),
    ));
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}/api`);
}
await bootstrap();
