import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from '../entities/visit.entity';
import { Visitor } from '../entities/visitor.entity';
import { CheckInRecord } from '../entities/check-in-record.entity';
import { Gate } from '../entities/gate.entity';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { CheckInService } from './checkin.service';
import { CheckInController } from './checkin.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, Visitor, CheckInRecord, Gate, BlacklistEntry]),
    NotificationsModule,
  ],
  providers: [CheckInService],
  controllers: [CheckInController],
  exports: [CheckInService],
})
export class CheckInModule {}
