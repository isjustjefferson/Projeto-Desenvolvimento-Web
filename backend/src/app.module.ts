import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DadosModule } from './dados/dados.module.js';

@Module({
  imports: [HealthModule, DadosModule],
})
export class AppModule {}