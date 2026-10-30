import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LocalEntity } from './local.entity.js';
import { UsuarioEntity } from './usuario.entity.js';

@Entity('chamados')
export class ChamadoEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 160, name: 'titulo', nullable: false })
  titulo!: string;

  @Column({ type: 'text', name: 'descricao', nullable: false })
  descricao!: string;

  @Column({ type: 'enum', enum: ['ELETRICA', 'HIDRAULICA', 'CLIMATIZACAO', 'MOBILIARIO', 'ESTRUTURAL', 'OUTROS'], name: 'categoria', nullable: false })
  categoria!: 'ELETRICA' | 'HIDRAULICA' | 'CLIMATIZACAO' | 'MOBILIARIO' | 'ESTRUTURAL' | 'OUTROS';

  @Column({ type: 'enum', enum: ['AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO'], name: 'status', nullable: false, default: 'AGUARDANDO_APROVACAO' })
  status!: 'AGUARDANDO_APROVACAO' | 'REVISADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

  @Column({ type: 'enum', enum: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'], name: 'prioridade', nullable: true })
  prioridade!: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | null;

  @Column({ type: 'integer', name: 'local_id', nullable: false })
  localId!: number;

  @ManyToOne(() => LocalEntity)
  @JoinColumn({ name: 'local_id' })
  local!: LocalEntity;

  @Column({ type: 'integer', name: 'criado_por_id', nullable: false })
  criadoPorId!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'criado_por_id' })
  criadoPor!: UsuarioEntity;

  @Column({ type: 'integer', name: 'tecnico_id', nullable: true })
  tecnicoId!: number | null;

  @ManyToOne(() => UsuarioEntity, { nullable: true })
  @JoinColumn({ name: 'tecnico_id' })
  tecnico!: UsuarioEntity | null;

  @Column({ type: 'bytea', name: 'foto', nullable: true })
  foto!: Buffer | null;

  @Column({ type: 'jsonb', name: 'classificacao', nullable: true })
  classificacao!: Record<string, any> | null;

  @Column({ type: 'text', name: 'solucao_descricao', nullable: true })
  solucaoDescricao!: string | null;

  @Column({ type: 'text', name: 'solucao_materiais', nullable: true })
  solucaoMateriais!: string | null;

  @Column({ type: 'timestamptz', name: 'criado_em', nullable: false, default: () => 'now()' })
  criadoEm!: Date;

  @Column({ type: 'timestamptz', name: 'atualizado_em', nullable: false, default: () => 'now()' })
  atualizadoEm!: Date;
}
