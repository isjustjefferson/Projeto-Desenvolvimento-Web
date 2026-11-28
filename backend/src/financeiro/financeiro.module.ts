import { Module } from '@nestjs/common';
import { AuthGuardsModule } from '../auth/auth.module.js';
import { ChamadosOperacoesModule } from '../chamados/chamados.module.js';
import { DadosModule } from '../dados/dados.module.js';
import { DatabaseRepositoriesModule } from '../database/database-repositories.module.js';
import { HealthModule } from '../health/health.module.js';
import { RelatoriosModule } from '../relatorios/relatorios.module.js';
import { FinanceiroController } from './financeiro.controller.js';

@Module({
  imports: [AuthGuardsModule, ChamadosOperacoesModule, DadosModule, DatabaseRepositoriesModule, RelatoriosModule],
  controllers: [FinanceiroController],
})
export class FinanceiroModule {}

@Module({ imports: [HealthModule, FinanceiroModule] })
export class FinanceiroAppModule {}
