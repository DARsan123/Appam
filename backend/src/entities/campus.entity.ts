import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Gate } from './gate.entity';
import { User } from './user.entity';

@Entity('campuses')
export class Campus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  city: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Gate, (gate) => gate.campus)
  gates: Gate[];

  @OneToMany(() => User, (user) => user.campus)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
