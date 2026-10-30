import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DespesaEntity } from './despesa.entity.js';

@Entity('anexos_despesa')
export class AnexoDespesaEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'despesa_id', nullable: false })
  despesaId!: number;

  @ManyToOne(() => DespesaEntity)
  @JoinColumn({ name: 'despesa_id' })
  despesa!: DespesaEntity;

  @Column({ type: 'varchar', length: 255, name: 'nome_arquivo', nullable: false })
  nomeArquivo!: string;

  @Column({ type: 'varchar', length: 100, name: 'tipo_mime', nullable: false })
  tipoMime!: string;

  @Column({ type: 'integer', name: 'tamanho_bytes', nullable: false })
  tamanhoBytes!: number;

  @Column({ type: 'bytea', name: 'conteudo', nullable: false })
  conteudo!: Buffer;

  @Column({ type: 'varchar', length: 64, name: 'hash_sha256', nullable: false })
  hashSha256!: string;

  @Column({ type: 'timestamptz', name: 'criado_em', nullable: false, default: () => 'now()' })
  criadoEm!: Date;
}
