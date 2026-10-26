import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { RelatoriosService } from './relatorios.service.js';

@Controller('relatorios')
@UseGuards(AuthGuard, RolesGuard)
@Roles('GESTOR', 'ADMINISTRADOR')
export class RelatoriosController {
  constructor(private readonly relatorios: RelatoriosService) {}

  @Get('despesas')
  despesas(
    @Query() filtros: any,
    @UsuarioAtual() usuario: UsuarioInterno,
  ) {
    return this.relatorios.despesas(usuario, filtros);
  }
}
