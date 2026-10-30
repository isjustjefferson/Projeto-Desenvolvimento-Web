import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DadosModule } from '../dados/dados.module.js';
import { DatabaseRepositoriesModule } from '../database/database-repositories.module.js';
import { ChamadosController } from './chamados.controller.js';
import { ChamadosService } from './chamados.service.js';

@Module({
  imports: [DadosModule, AuthModule, DatabaseRepositoriesModule],
  controllers: [ChamadosController],
  providers: [ChamadosService],
})
export class ChamadosModule {}