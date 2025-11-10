import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('neighborhoods')
export class Neighborhood {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 50 })
  area: 'الساحل الأيمن' | 'الساحل الأيسر';

  @CreateDateColumn()
  created_at: Date;
}
