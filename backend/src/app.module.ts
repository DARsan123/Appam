import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { VisitsModule } from './visits/visits.module';
import { CheckInModule } from './checkin/checkin.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { CampusesModule } from './campuses/campuses.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { BulkModule } from './bulk/bulk.module';
import { SyncModule } from './sync/sync.module';
import { ReportsModule } from './reports/reports.module';
import { PublicRegistrationModule } from './public-registration/public-registration.module';
import { Campus } from './entities/campus.entity';
import { Gate } from './entities/gate.entity';
import { User } from './entities/user.entity';
import { Visitor } from './entities/visitor.entity';
import { Visit } from './entities/visit.entity';
import { CheckInRecord } from './entities/check-in-record.entity';
import { BlacklistEntry } from './entities/blacklist-entry.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Event } from './entities/event.entity';
import { VendorPass } from './entities/vendor-pass.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get('DB_TYPE', 'sqlite');
        if (dbType === 'postgres') {
          return {
            type: 'postgres' as const,
            host: config.get('DB_HOST', 'localhost'),
            port: parseInt(config.get('DB_PORT', '5432')),
            username: config.get('DB_USER', 'vms'),
            password: config.get('DB_PASSWORD', 'vms_secret'),
            database: config.get('DB_NAME', 'iiml_vms'),
            entities: [
              Campus, Gate, User, Visitor, Visit, CheckInRecord,
              BlacklistEntry, AuditLog, Event, VendorPass, OtpVerification, Notification,
            ],
            synchronize: true,
          };
        }
        return {
          type: 'better-sqlite3' as const,
          database: config.get('SQLITE_PATH', 'iiml_vms.sqlite'),
          entities: [
            Campus, Gate, User, Visitor, Visit, CheckInRecord,
            BlacklistEntry, AuditLog, Event, VendorPass, OtpVerification, Notification,
          ],
          synchronize: true,
        };
      },
    }),
    AuthModule,
    AuditModule,
    NotificationsModule,
    VisitsModule,
    CheckInModule,
    BlacklistModule,
    CampusesModule,
    UsersModule,
    EventsModule,
    BulkModule,
    SyncModule,
    ReportsModule,
    PublicRegistrationModule,
  ],
})
export class AppModule {}
