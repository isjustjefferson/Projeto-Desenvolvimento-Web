import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DadosModule } from '../dados/dados.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { DatabaseRepositoriesModule } from '../database/database-repositories.module.js';
import { ChamadosController } from './chamados.controller.js';
import { ChamadosService } from './chamados.service.js';

@Module({
  imports: [DadosModule, DatabaseModule, DatabaseRepositoriesModule],
  providers: [ChamadosService],
  exports: [ChamadosService],
})
export class ChamadosOperacoesModule {}

@Module({
  imports: [AuthModule, ChamadosOperacoesModule, DadosModule, DatabaseRepositoriesModule],
  controllers: [ChamadosController],
})
export class ChamadosModule {}
