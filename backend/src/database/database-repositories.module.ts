import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsuarioEntity } from './entities/usuario.entity.js';
import { LocalEntity } from './entities/local.entity.js';
import { ChamadoEntity } from './entities/chamado.entity.js';
import { HistoricoEntity } from './entities/historico.entity.js';
import { TokenResetEntity } from './entities/token-reset.entity.js';
import { DespesaEntity } from './entities/despesa.entity.js';
import { AnexoDespesaEntity } from './entities/anexo-despesa.entity.js';

@Module({
  providers: [
    {
      provide: 'USUARIO_REPO',
      useFactory: (ds: DataSource) => ds.getRepository(UsuarioEntity),
      inject: [DataSource],
    },
    {
      provide: 'LOCAL_REPO',
      useFactory: (ds: DataSource) => ds.getRepository(LocalEntity),
      inject: [DataSource],
    },
    {
      provide: 'CHAMADO_REPO',
      useFactory: (ds: DataSource) => ds.getRepository(ChamadoEntity),
      inject: [DataSource],
    },
    {
      provide: 'HISTORICO_REPO',
      useFactory: (ds: DataSource) => ds.getRepository(HistoricoEntity),
      inject: [DataSource],
    },
    {
      provide: 'TOKEN_RESET_REPO',
      useFactory: (ds: DataSource) => ds.getRepository(TokenResetEntity),
      inject: [DataSource],
    },
    {
      provide: 'DESPESA_REPO',
      useFactory: (ds: DataSource) => ds.getRepository(DespesaEntity),
      inject: [DataSource],
    },
    {
      provide: 'ANEXO_DESPESA_REPO',
      useFactory: (ds: DataSource) => ds.getRepository(AnexoDespesaEntity),
      inject: [DataSource],
    },
  ],
  exports: ['USUARIO_REPO', 'LOCAL_REPO', 'CHAMADO_REPO', 'HISTORICO_REPO', 'TOKEN_RESET_REPO', 'DESPESA_REPO', 'ANEXO_DESPESA_REPO'],
})
export class DatabaseRepositoriesModule {}
