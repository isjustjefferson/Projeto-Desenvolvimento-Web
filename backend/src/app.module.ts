import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DadosModule } from './dados/dados.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { ChamadosModule } from './chamados/chamados.module.js';
import { FinanceiroModule } from './financeiro/financeiro.module.js';

const modulosChamados = [
  HealthModule,
  DatabaseModule,
  DadosModule,
  AuthModule,
  UsuariosModule,
  ChamadosModule,
];

@Module({ imports: [...modulosChamados, FinanceiroModule] })
export class AppModule {}

@Module({ imports: modulosChamados })
export class ChamadosAppModule {}
