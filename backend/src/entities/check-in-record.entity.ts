import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CheckInMode } from '../common/enums';
import { Visit } from './visit.entity';
import { Gate } from './gate.entity';
import { User } from './user.entity';

@Entity('check_in_records')
export class CheckInRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  visitId: string;

  @ManyToOne(() => Visit, (visit) => visit.checkInRecords)
  @JoinColumn({ name: 'visitId' })
  visit: Visit;

  @Column()
  gateId: string;

  @ManyToOne(() => Gate)
  @JoinColumn({ name: 'gateId' })
  gate: Gate;

  @Column({ nullable: true })
  securityOfficerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'securityOfficerId' })
  securityOfficer: User;

  @Column({ type: 'datetime' })
  checkInTime: Date;

  @Column({ type: 'datetime', nullable: true })
  checkOutTime: Date;

  @Column({ type: 'enum', enum: CheckInMode, default: CheckInMode.STANDARD })
  mode: CheckInMode;

  @Column({ nullable: true })
  badgeNumber: string;

  @Column({ default: false })
  syncedFromOffline: boolean;

  @Column({ nullable: true })
  offlineClientId: string;

  @CreateDateColumn()
  createdAt: Date;
}
