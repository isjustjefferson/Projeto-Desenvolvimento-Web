import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DadosModule } from '../dados/dados.module.js';
import { DatabaseRepositoriesModule } from '../database/database-repositories.module.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [DadosModule, AuthModule, DatabaseRepositoriesModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}