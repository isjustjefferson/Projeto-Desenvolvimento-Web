import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DadosModule } from './dados/dados.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { ChamadosModule } from './chamados/chamados.module.js';
import { RelatoriosModule } from './relatorios/relatorios.module.js';

@Module({
  imports: [
    HealthModule,
    DatabaseModule,
    DadosModule,
    AuthModule,
    UsuariosModule,
    ChamadosModule,
    RelatoriosModule,
  ],
})
export class AppModule {}