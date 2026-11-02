import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DadosModule } from '../dados/dados.module.js';
import { RelatoriosController } from './relatorios.controller.js';
import { RelatoriosService } from './relatorios.service.js';

@Module({
  imports: [DadosModule, AuthModule],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
