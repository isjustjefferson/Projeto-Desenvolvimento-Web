import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DadosModule } from './dados/dados.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [HealthModule, DadosModule, AuthModule],
})
export class AppModule {}