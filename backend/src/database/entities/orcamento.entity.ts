import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChamadoEntity } from './chamado.entity.js';
import { UsuarioEntity } from './usuario.entity.js';

@Entity('orcamentos')
export class OrcamentoEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'chamado_id', nullable: false })
  chamadoId!: number;

  @ManyToOne(() => ChamadoEntity)
  @JoinColumn({ name: 'chamado_id' })
  chamado!: ChamadoEntity;

  @Column({ type: 'integer', name: 'prestador_id', nullable: false })
  prestadorId!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'prestador_id' })
  prestador!: UsuarioEntity;

  @Column({ type: 'text', name: 'descricao', nullable: false })
  descricao!: string;

  @Column({ type: 'integer', name: 'valor_centavos', nullable: false })
  valorCentavos!: number;

  @Column({ type: 'enum', enum: ['PENDENTE', 'APROVADO', 'REJEITADO'], name: 'status', nullable: false, default: 'PENDENTE' })
  status!: 'PENDENTE' | 'APROVADO' | 'REJEITADO';

  @Column({ type: 'text', name: 'motivo_rejeicao', nullable: true })
  motivoRejeicao!: string | null;

  @Column({ type: 'integer', name: 'aprovado_por_id', nullable: true })
  aprovadoPorId!: number | null;

  @ManyToOne(() => UsuarioEntity, { nullable: true })
  @JoinColumn({ name: 'aprovado_por_id' })
  aprovadoPor!: UsuarioEntity | null;

  @Column({ type: 'timestamptz', name: 'aprovado_em', nullable: true })
  aprovadoEm!: Date | null;

  @Column({ type: 'timestamptz', name: 'criado_em', nullable: false, default: () => 'now()' })
  criadoEm!: Date;

  @Column({ type: 'timestamptz', name: 'atualizado_em', nullable: false, default: () => 'now()' })
  atualizadoEm!: Date;
}
