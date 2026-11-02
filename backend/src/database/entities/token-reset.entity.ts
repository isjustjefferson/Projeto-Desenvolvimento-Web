import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioEntity } from './usuario.entity.js';

@Entity('tokens_reset')
export class TokenResetEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'integer', name: 'usuario_id', nullable: false })
  usuarioId!: number;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: UsuarioEntity;

  @Column({ type: 'varchar', length: 120, name: 'token', nullable: false, unique: true })
  token!: string;

  @Column({ type: 'timestamptz', name: 'expira_em', nullable: false })
  expiraEm!: Date;

  @Column({ type: 'timestamptz', name: 'usado_em', nullable: true })
  usadoEm!: Date | null;

  @Column({ type: 'timestamptz', name: 'criado_em', nullable: false, default: () => 'now()' })
  criadoEm!: Date;
}
