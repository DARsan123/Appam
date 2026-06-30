import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campus } from './campus.entity';
import { User } from './user.entity';

@Entity('blacklist_entries')
export class BlacklistEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  visitorId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  idProofNumber: string;

  @Column()
  reason: string;

  @Column()
  reasonCode: string;

  @Column({ nullable: true })
  evidenceUrl: string;

  @Column({ default: true })
  isGlobal: boolean;

  @Column({ nullable: true })
  scopeCampusId: string;

  @ManyToOne(() => Campus, { nullable: true })
  @JoinColumn({ name: 'scopeCampusId' })
  scopeCampus: Campus;

  @Column({ type: 'datetime', nullable: true })
  reviewDate: Date;

  @Column({ type: 'datetime', nullable: true })
  expiresAt: Date;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
