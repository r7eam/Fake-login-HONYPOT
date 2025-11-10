import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Profession } from '../../professions/entities/professions.entity';

@Entity('workers')
export class Worker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  user_id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  profession_id: number;

  @ManyToOne(() => Profession)
  @JoinColumn({ name: 'profession_id' })
  profession: Profession;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: 0 })
  experience_years: number;

  // Contact information
  @Column({ length: 20, nullable: true })
  contact_phone: string;

  @Column({ length: 20, nullable: true })
  whatsapp_number: string;

  @Column({ length: 255, nullable: true })
  facebook_url: string;

  @Column({ length: 255, nullable: true })
  instagram_url: string;

  // Status and statistics
  @Column({ default: true })
  is_available: boolean;

  @Column({ default: 0 })
  total_jobs: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
  average_rating: number;

  @Column({ nullable: true })
  profile_image: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}