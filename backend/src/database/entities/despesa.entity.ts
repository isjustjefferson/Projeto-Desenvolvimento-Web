import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChamadoEntity } from './chamado.entity.js';
import { UsuarioEntity } from './usuario.entity.js';
import { AnexoDespesaEntity } from './anexo-despesa.entity.js';

@Entity('despesas')
export class DespesaEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'chamado_id', nullable: false })
  chamadoId!: number;

  @ManyToOne(() => ChamadoEntity)
  @JoinColumn({ name: 'chamado_id' })
  chamado!: ChamadoEntity;

  @Column({ type: 'integer', name: 'registrado_por_id', nullable: false })
  registradoPorId!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'registrado_por_id' })
  registradoPor!: UsuarioEntity;

  @Column({ type: 'enum', enum: ['MATERIAL', 'MAO_DE_OBRA', 'SERVICO_TERCEIRO', 'DESLOCAMENTO', 'OUTROS'], name: 'categoria', nullable: false })
  categoria!: 'MATERIAL' | 'MAO_DE_OBRA' | 'SERVICO_TERCEIRO' | 'DESLOCAMENTO' | 'OUTROS';

  @Column({ type: 'text', name: 'descricao', nullable: false })
  descricao!: string;

  @Column({ type: 'varchar', length: 160, name: 'fornecedor', nullable: true })
  fornecedor!: string | null;

  @Column({ type: 'varchar', length: 18, name: 'cnpj', nullable: true })
  cnpj!: string | null;

  @Column({ type: 'varchar', length: 60, name: 'numero_nota', nullable: true })
  numeroNota!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'serie', nullable: true })
  serie!: string | null;

  @Column({ type: 'date', name: 'data_emissao', nullable: true })
  dataEmissao!: string | null;

  @Column({ type: 'integer', name: 'valor_centavos', nullable: false })
  valorCentavos!: number;

  @Column({ type: 'enum', enum: ['DINHEIRO', 'PIX', 'CARTAO', 'FATURADO'], name: 'forma_pagamento', nullable: true })
  formaPagamento!: 'DINHEIRO' | 'PIX' | 'CARTAO' | 'FATURADO' | null;

  @Column({ type: 'enum', enum: ['TECNICO', 'EMPRESA'], name: 'pago_por', nullable: true })
  pagoPor!: 'TECNICO' | 'EMPRESA' | null;

  @Column({ type: 'enum', enum: ['PENDENTE', 'APROVADA', 'REJEITADA'], name: 'status', nullable: false, default: 'PENDENTE' })
  status!: 'PENDENTE' | 'APROVADA' | 'REJEITADA';

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

  @OneToMany(() => AnexoDespesaEntity, (a) => a.despesa)
  anexos!: AnexoDespesaEntity[];
}
