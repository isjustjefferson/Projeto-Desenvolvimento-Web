import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { DespesaEntity } from './despesa.entity.js';
import { UsuarioEntity } from './usuario.entity.js';

@Entity('anexos_despesa')
export class AnexoDespesaEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'despesa_id', nullable: false })
  despesaId!: number;

  @ManyToOne(() => DespesaEntity)
  @JoinColumn({ name: 'despesa_id' })
  // Relation<> evita emitir a classe na metadata: despesa.entity importa esta
  // entidade de volta, e no ESM a referência ainda não existiria ao carregar.
  despesa!: Relation<DespesaEntity>;

  @Column({ type: 'enum', enum: ['NOTA_FISCAL', 'RECIBO', 'COMPROVANTE_PAGAMENTO', 'OUTRO'], name: 'tipo', nullable: false })
  tipo!: 'NOTA_FISCAL' | 'RECIBO' | 'COMPROVANTE_PAGAMENTO' | 'OUTRO';

  @Column({ type: 'enum', enum: ['NFE', 'NFSE', 'NFCE', 'CUPOM_FISCAL', 'RECIBO', 'BOLETO_COMPROVANTE', 'OUTRO'], name: 'tipo_documento_fiscal', nullable: true })
  tipoDocumentoFiscal!: 'NFE' | 'NFSE' | 'NFCE' | 'CUPOM_FISCAL' | 'RECIBO' | 'BOLETO_COMPROVANTE' | 'OUTRO' | null;

  @Column({ type: 'varchar', length: 44, name: 'chave_nfe', nullable: true })
  chaveNfe!: string | null;

  @Column({ type: 'varchar', length: 60, name: 'numero', nullable: true })
  numero!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'serie', nullable: true })
  serie!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'nome_arquivo', nullable: false })
  nomeArquivo!: string;

  @Column({ type: 'varchar', length: 120, name: 'mime_type', nullable: false })
  mimeType!: string;

  @Column({ type: 'integer', name: 'tamanho_bytes', nullable: false })
  tamanhoBytes!: number;

  @Column({ type: 'varchar', length: 64, name: 'hash_sha256', nullable: true })
  hashSha256!: string | null;

  @Column({ type: 'bytea', name: 'conteudo', nullable: true })
  conteudo!: Buffer | null;

  @Column({ type: 'integer', name: 'enviado_por_id', nullable: false })
  enviadoPorId!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'enviado_por_id' })
  enviadoPor!: UsuarioEntity;

  @Column({ type: 'timestamptz', name: 'criado_em', nullable: false, default: () => 'now()' })
  criadoEm!: Date;
}
