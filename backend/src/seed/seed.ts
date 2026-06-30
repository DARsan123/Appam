import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Campus } from '../entities/campus.entity';
import { Gate } from '../entities/gate.entity';
import { User } from '../entities/user.entity';
import { Event } from '../entities/event.entity';
import { Visitor } from '../entities/visitor.entity';
import { Visit } from '../entities/visit.entity';
import { CheckInRecord } from '../entities/check-in-record.entity';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { VendorPass } from '../entities/vendor-pass.entity';
import { OtpVerification } from '../entities/otp-verification.entity';
import { Notification } from '../entities/notification.entity';
import { UserRole } from '../common/enums';

const dbType = process.env.DB_TYPE || 'sqlite';

const AppDataSource = new DataSource(
  dbType === 'postgres'
    ? {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'vms',
        password: process.env.DB_PASSWORD || 'vms_secret',
        database: process.env.DB_NAME || 'iiml_vms',
        entities: [Campus, Gate, User, Visitor, Visit, CheckInRecord, BlacklistEntry, AuditLog, Event, VendorPass, OtpVerification, Notification],
        synchronize: true,
      }
    : {
        type: 'better-sqlite3',
        database: process.env.SQLITE_PATH || 'iiml_vms.sqlite',
        entities: [Campus, Gate, User, Visitor, Visit, CheckInRecord, BlacklistEntry, AuditLog, Event, VendorPass, OtpVerification, Notification],
        synchronize: true,
      },
);

async function seed() {
  await AppDataSource.initialize();
  console.log('Seeding database...');

  const campusRepo = AppDataSource.getRepository(Campus);
  const gateRepo = AppDataSource.getRepository(Gate);
  const userRepo = AppDataSource.getRepository(User);
  const eventRepo = AppDataSource.getRepository(Event);

  let lucknow = await campusRepo.findOne({ where: { code: 'LKO' } });
  if (!lucknow) {
    lucknow = await campusRepo.save(
      campusRepo.create({ code: 'LKO', name: 'IIM Lucknow - Main Campus', city: 'Lucknow' }),
    );
  }

  let noida = await campusRepo.findOne({ where: { code: 'NCR' } });
  if (!noida) {
    noida = await campusRepo.save(
      campusRepo.create({ code: 'NCR', name: 'IIM Lucknow - Noida Campus', city: 'Noida' }),
    );
  }

  const gates = [
    { name: 'Main Gate', location: 'Entrance', campusId: lucknow.id },
    { name: 'Hostel Gate', location: 'Hostel Block', campusId: lucknow.id, eventModeEnabled: false },
    { name: 'Placement Fast Lane', location: 'Auditorium', campusId: lucknow.id, eventModeEnabled: true },
    { name: 'Noida Main Gate', location: 'Entrance', campusId: noida.id },
  ];

  for (const g of gates) {
    const exists = await gateRepo.findOne({ where: { name: g.name, campusId: g.campusId } });
    if (!exists) await gateRepo.save(gateRepo.create(g));
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@iiml.ac.in', name: 'System Admin', role: UserRole.ADMIN, campusId: lucknow.id },
    { email: 'host@iiml.ac.in', name: 'Prof. Rajesh Kumar', role: UserRole.HOST, department: 'Finance', campusId: lucknow.id, erpEmployeeId: 'EMP001' },
    { email: 'security@iiml.ac.in', name: 'Security Officer Singh', role: UserRole.GATE_SECURITY, campusId: lucknow.id },
    { email: 'supervisor@iiml.ac.in', name: 'Security Head Sharma', role: UserRole.SECURITY_SUPERVISOR, campusId: lucknow.id },
    { email: 'coordinator@iiml.ac.in', name: 'Placement Coordinator', role: UserRole.EVENT_COORDINATOR, campusId: lucknow.id },
    { email: 'compliance@iiml.ac.in', name: 'Compliance Officer', role: UserRole.COMPLIANCE, campusId: lucknow.id },
    { email: 'host.noida@iiml.ac.in', name: 'Prof. Mehta', role: UserRole.HOST, department: 'Operations', campusId: noida.id, erpEmployeeId: 'EMP002' },
    { email: 'security.noida@iiml.ac.in', name: 'Noida Security', role: UserRole.GATE_SECURITY, campusId: noida.id },
  ];

  for (const u of users) {
    const exists = await userRepo.findOne({ where: { email: u.email } });
    if (!exists) {
      await userRepo.save(userRepo.create({ ...u, passwordHash, notificationChannels: ['sms', 'in_app'] }));
    }
  }

  const coordinator = await userRepo.findOne({ where: { email: 'coordinator@iiml.ac.in' } });
  if (coordinator) {
    const eventExists = await eventRepo.findOne({ where: { name: 'Placement Drive 2026' } });
    if (!eventExists) {
      await eventRepo.save(
        eventRepo.create({
          name: 'Placement Drive 2026',
          campusId: lucknow.id,
          coordinatorId: coordinator.id,
          startDate: new Date('2026-07-15T09:00:00'),
          endDate: new Date('2026-07-15T18:00:00'),
          expectedAttendees: 500,
          fastLaneEnabled: true,
        }),
      );
    }
  }

  console.log('Seed complete!');
  console.log('Demo accounts (password: password123):');
  users.forEach((u) => console.log(`  ${u.email} (${u.role})`));

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
