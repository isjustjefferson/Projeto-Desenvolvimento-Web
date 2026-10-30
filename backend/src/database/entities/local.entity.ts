import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('locais')
export class LocalEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number;

  @Column({ type: 'varchar', length: 80, name: 'predio', nullable: false })
  predio!: string;

  @Column({ type: 'varchar', length: 40, name: 'andar', nullable: true })
  andar!: string | null;

  @Column({ type: 'varchar', length: 60, name: 'sala', nullable: true })
  sala!: string | null;
}
