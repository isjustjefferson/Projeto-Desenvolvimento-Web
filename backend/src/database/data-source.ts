import { DataSource } from 'typeorm';
import { typeormConfig } from './typeorm.config.js';
import { UsuarioEntity } from './entities/usuario.entity.js';
import { LocalEntity } from './entities/local.entity.js';
import { ChamadoEntity } from './entities/chamado.entity.js';
import { HistoricoEntity } from './entities/historico.entity.js';
import { TokenResetEntity } from './entities/token-reset.entity.js';
import { DespesaEntity } from './entities/despesa.entity.js';
import { AnexoDespesaEntity } from './entities/anexo-despesa.entity.js';

export default new DataSource({
  ...(typeormConfig as any),
  entities: [UsuarioEntity, LocalEntity, ChamadoEntity, HistoricoEntity, TokenResetEntity, DespesaEntity, AnexoDespesaEntity],
  migrations: ['dist/database/migrations/*.js'],
});
