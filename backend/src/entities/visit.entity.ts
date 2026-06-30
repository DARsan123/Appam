import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { VisitStatus, VisitorCategory, BadgeType } from '../common/enums';
import { Visitor } from './visitor.entity';
import { User } from './user.entity';
import { Campus } from './campus.entity';
import { CheckInRecord } from './check-in-record.entity';

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  visitorId: string;

  @ManyToOne(() => Visitor, (visitor) => visitor.visits)
  @JoinColumn({ name: 'visitorId' })
  visitor: Visitor;

  @Column()
  hostId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'hostId' })
  host: User;

  @Column()
  campusId: string;

  @ManyToOne(() => Campus)
  @JoinColumn({ name: 'campusId' })
  campus: Campus;

  @Column({ nullable: true })
  building: string;

  @Column()
  purpose: string;

  @Column({ type: 'enum', enum: VisitorCategory, default: VisitorCategory.INDIVIDUAL })
  category: VisitorCategory;

  @Column({ type: 'enum', enum: VisitStatus, default: VisitStatus.PENDING_APPROVAL })
  status: VisitStatus;

  @Column({ type: 'enum', enum: BadgeType, default: BadgeType.STANDARD })
  badgeType: BadgeType;

  @Column({ type: 'datetime' })
  expectedStart: Date;

  @Column({ type: 'datetime' })
  expectedEnd: Date;

  @Column({ unique: true })
  qrToken: string;

  @Column({ default: false })
  qrUsed: boolean;

  @Column({ nullable: true })
  vehicleNumber: string;

  @Column({ nullable: true })
  eventId: string;

  @Column({ nullable: true })
  vendorPassId: string;

  @Column({ nullable: true })
  securityNotes: string;

  @Column({ default: false })
  isVip: boolean;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ default: 0 })
  approvalLevel: number;

  @Column({ default: 1 })
  requiredApprovalLevels: number;

  @OneToMany(() => CheckInRecord, (record) => record.visit)
  checkInRecords: CheckInRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
