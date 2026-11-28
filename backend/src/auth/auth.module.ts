import { Module } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { DadosModule } from '../dados/dados.module.js';
import { DatabaseRepositoriesModule } from '../database/database-repositories.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { MeController } from './me.controller.js';
import { SessoesService } from './sessoes.service.js';

@Module({
  imports: [DadosModule, DatabaseRepositoriesModule],
  providers: [AuthGuard, RolesGuard, SessoesService],
  exports: [AuthGuard, RolesGuard, SessoesService],
})
export class AuthGuardsModule {}

@Module({
  imports: [DadosModule, DatabaseRepositoriesModule, AuthGuardsModule],
  controllers: [AuthController, MeController],
  providers: [AuthService],
  exports: [AuthService, AuthGuardsModule],
})
export class AuthModule {}
