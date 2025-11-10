import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Worker } from '../../workers/entities/worker.entity';

@Entity('worker_portfolio')
export class WorkerPortfolio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  worker_id: number;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column({ length: 255 })
  image_url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;
}