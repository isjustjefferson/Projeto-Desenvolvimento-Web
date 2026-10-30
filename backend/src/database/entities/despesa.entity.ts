import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChamadoEntity } from './chamado.entity.js';
import { UsuarioEntity } from './usuario.entity.js';

@Entity('despesas')
export class DespesaEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'chamado_id', nullable: false })
  chamadoId!: number;

  @ManyToOne(() => ChamadoEntity)
  @JoinColumn({ name: 'chamado_id' })
  chamado!: ChamadoEntity;

  @Column({ type: 'integer', name: 'tecnico_id', nullable: false })
  tecnicoId!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'tecnico_id' })
  tecnico!: UsuarioEntity;

  @Column({ type: 'enum', enum: ['MATERIAL', 'SERVICO', 'TRANSPORTE', 'OUTROS'], name: 'tipo', nullable: false })
  tipo!: 'MATERIAL' | 'SERVICO' | 'TRANSPORTE' | 'OUTROS';

  @Column({ type: 'varchar', length: 255, name: 'descricao', nullable: false })
  descricao!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'valor', nullable: false })
  valor!: string;

  @Column({ type: 'date', name: 'data', nullable: false })
  data!: string;

  @Column({ type: 'varchar', length: 50, name: 'numero_nota', nullable: true })
  numeroNota!: string | null;

  @Column({ type: 'varchar', length: 120, name: 'fornecedor', nullable: true })
  fornecedor!: string | null;

  @Column({ type: 'enum', enum: ['AGUARDANDO', 'APROVADO', 'REPROVADO'], name: 'status', nullable: false, default: 'AGUARDANDO' })
  status!: 'AGUARDANDO' | 'APROVADO' | 'REPROVADO';

  @Column({ type: 'integer', name: 'aprovado_por_id', nullable: true })
  aprovadoPorId!: number | null;

  @ManyToOne(() => UsuarioEntity, { nullable: true })
  @JoinColumn({ name: 'aprovado_por_id' })
  aprovadoPor!: UsuarioEntity | null;

  @Column({ type: 'timestamptz', name: 'aprovado_em', nullable: true })
  aprovadoEm!: Date | null;

  @Column({ type: 'text', name: 'justificativa_reprovacao', nullable: true })
  justificativaReprovacao!: string | null;

  @Column({ type: 'timestamptz', name: 'criado_em', nullable: false, default: () => 'now()' })
  criadoEm!: Date;

  @Column({ type: 'timestamptz', name: 'atualizado_em', nullable: false, default: () => 'now()' })
  atualizadoEm!: Date;
}
