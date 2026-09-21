import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DadosModule } from './dados/dados.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { ChamadosModule } from './chamados/chamados.module.js';

@Module({
  imports: [
    HealthModule,
    DadosModule,
    AuthModule,
    UsuariosModule,
    ChamadosModule,
  ],
})
export class AppModule {}