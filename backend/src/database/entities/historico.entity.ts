import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import type { ChamadoEntity } from './chamado.entity.js';
import { UsuarioEntity } from './usuario.entity.js';

@Entity('historicos')
export class HistoricoEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'chamado_id', nullable: false })
  chamadoId!: number;

  @ManyToOne('ChamadoEntity', 'historicos')
  @JoinColumn({ name: 'chamado_id' })
  // Relation<> evita emitir a classe na metadata: chamado.entity importa esta
  // entidade de volta, e no ESM a referência ainda não existiria ao carregar.
  chamado!: Relation<ChamadoEntity>;

  @Column({ type: 'integer', name: 'usuario_id', nullable: false })
  usuarioId!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UsuarioEntity;

  @Column({ type: 'enum', enum: ['AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'], name: 'de_status', nullable: true })
  deStatus!: 'AGUARDANDO_APROVACAO' | 'REVISADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | null;

  @Column({ type: 'enum', enum: ['AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'], name: 'para_status', nullable: false })
  paraStatus!: 'AGUARDANDO_APROVACAO' | 'REVISADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

  @Column({ type: 'timestamptz', name: 'data_hora', nullable: false, default: () => 'now()' })
  dataHora!: Date;

  @Column({ type: 'text', name: 'observacao', nullable: true })
  observacao!: string | null;
}
