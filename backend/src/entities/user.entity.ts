import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../common/enums';
import { Campus } from './campus.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.HOST })
  role: UserRole;

  @Column({ nullable: true })
  campusId: string;

  @ManyToOne(() => Campus, (campus) => campus.users, { nullable: true })
  @JoinColumn({ name: 'campusId' })
  campus: Campus;

  @Column({ nullable: true })
  erpEmployeeId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  notificationChannels: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
