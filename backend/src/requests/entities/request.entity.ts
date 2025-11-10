import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Worker } from '../../workers/entities/worker.entity';

@Entity('requests')
export class Request {
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

  @Column({ type: 'text' })
  problem_description: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'pending' 
  })
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  rejected_reason: string;
}