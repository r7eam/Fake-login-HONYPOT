import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Request } from '../../requests/entities/request.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  request_id: number;

  @OneToOne(() => Request, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: Request;

  @Column()
  worker_id: number;

  @ManyToOne(() => Worker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'worker_id' })
  worker: Worker;

  @Column()
  client_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({
    type: 'int',
    transformer: {
      to: (value) => value,
      from: (value) => value
    }
  })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}