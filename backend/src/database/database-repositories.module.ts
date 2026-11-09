import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsuarioEntity } from './entities/usuario.entity.js';
import { LocalEntity } from './entities/local.entity.js';
import { ChamadoEntity } from './entities/chamado.entity.js';
import { HistoricoEntity } from './entities/historico.entity.js';
import { TokenResetEntity } from './entities/token-reset.entity.js';
import { DespesaEntity } from './entities/despesa.entity.js';
import { AnexoDespesaEntity } from './entities/anexo-despesa.entity.js';

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;

@Module({
  providers: [
    {
      provide: 'USUARIO_REPO',
      useFactory: (ds?: DataSource) => (ds ? ds.getRepository(UsuarioEntity) : ({} as any)),
      inject: isTest ? [] : [DataSource],
    },
    {
      provide: 'LOCAL_REPO',
      useFactory: (ds?: DataSource) => (ds ? ds.getRepository(LocalEntity) : ({} as any)),
      inject: isTest ? [] : [DataSource],
    },
    {
      provide: 'CHAMADO_REPO',
      useFactory: (ds?: DataSource) => (ds ? ds.getRepository(ChamadoEntity) : ({} as any)),
      inject: isTest ? [] : [DataSource],
    },
    {
      provide: 'HISTORICO_REPO',
      useFactory: (ds?: DataSource) => (ds ? ds.getRepository(HistoricoEntity) : ({} as any)),
      inject: isTest ? [] : [DataSource],
    },
    {
      provide: 'TOKEN_RESET_REPO',
      useFactory: (ds?: DataSource) => (ds ? ds.getRepository(TokenResetEntity) : ({} as any)),
      inject: isTest ? [] : [DataSource],
    },
    {
      provide: 'DESPESA_REPO',
      useFactory: (ds?: DataSource) => (ds ? ds.getRepository(DespesaEntity) : ({} as any)),
      inject: isTest ? [] : [DataSource],
    },
    {
      provide: 'ANEXO_DESPESA_REPO',
      useFactory: (ds?: DataSource) => (ds ? ds.getRepository(AnexoDespesaEntity) : ({} as any)),
      inject: isTest ? [] : [DataSource],
    },
    {
      provide: 'DATA_SOURCE',
      useFactory: (ds?: DataSource) => ds ?? ({} as any),
      inject: isTest ? [] : [DataSource],
    },
  ],
  exports: ['USUARIO_REPO', 'LOCAL_REPO', 'CHAMADO_REPO', 'HISTORICO_REPO', 'TOKEN_RESET_REPO', 'DESPESA_REPO', 'ANEXO_DESPESA_REPO', 'DATA_SOURCE'],
})
export class DatabaseRepositoriesModule {}
