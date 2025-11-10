import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';

@Entity('favorites')
@Unique(['client_id', 'worker_id'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  client_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column()
  worker_id: number;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}