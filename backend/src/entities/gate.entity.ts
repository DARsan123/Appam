import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campus } from './campus.entity';

@Entity('gates')
export class Gate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column({ default: false })
  eventModeEnabled: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  campusId: string;

  @ManyToOne(() => Campus, (campus) => campus.gates)
  @JoinColumn({ name: 'campusId' })
  campus: Campus;

  @CreateDateColumn()
  createdAt: Date;
}
