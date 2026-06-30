import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Visit } from './visit.entity';

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  idProofType: string;

  @Column({ nullable: true })
  idProofNumber: string;

  @Column({ nullable: true })
  idDocumentUrl: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true })
  company: string;

  @Column({ default: false })
  consentGiven: boolean;

  @Column({ nullable: true })
  consentTimestamp: Date;

  @OneToMany(() => Visit, (visit) => visit.visitor)
  visits: Visit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
