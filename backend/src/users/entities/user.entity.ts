import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Neighborhood } from '../../neighborhoods/entities/neighborhoods.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 150, unique: true, nullable: true })
  email: string;

  @Column({ length: 20, unique: true })
  phone: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20 })
  role: 'client' | 'worker' | 'admin';

  @Column({ nullable: true })
  neighborhood_id: number;

  @ManyToOne(() => Neighborhood)
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood: Neighborhood;

  // New fields from database schema
  @Column({ default: false })
  email_verified: boolean;

  @Column({ default: false })
  phone_verified: boolean;

  @Column({ nullable: true })
  last_login: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
