import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios')
export class UsuarioEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 120, name: 'nome', nullable: false })
  nome!: string;

  @Column({ type: 'varchar', length: 180, name: 'email', nullable: false, unique: true })
  email!: string;

  @Column({ type: 'enum', enum: ['SOLICITANTE', 'TECNICO', 'GESTOR', 'ADMINISTRADOR'], name: 'papel', nullable: false })
  papel!: 'SOLICITANTE' | 'TECNICO' | 'GESTOR' | 'ADMINISTRADOR';

  @Column({ type: 'varchar', length: 120, name: 'localizacao', nullable: true })
  localizacao!: string | null;

  @Column({ type: 'varchar', length: 120, name: 'unidade', nullable: true })
  unidade!: string | null;

  @Column({ type: 'varchar', length: 120, name: 'setor', nullable: true })
  setor!: string | null;

  @Column({ type: 'varchar', length: 80, name: 'especialidade', nullable: true })
  especialidade!: string | null;

  @Column({ type: 'boolean', name: 'ativo', nullable: false, default: true })
  ativo!: boolean;

  @Column({ type: 'bytea', name: 'foto', nullable: true })
  foto!: Buffer | null;

  @Column({ type: 'varchar', length: 100, name: 'senha_hash', nullable: false })
  senhaHash!: string;

  @Column({ type: 'timestamptz', name: 'criado_em', nullable: false, default: () => 'now()' })
  criadoEm!: Date;
}
