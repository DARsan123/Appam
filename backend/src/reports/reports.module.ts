import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from '../entities/visit.entity';
import { CheckInRecord } from '../entities/check-in-record.entity';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, CheckInRecord, BlacklistEntry])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
