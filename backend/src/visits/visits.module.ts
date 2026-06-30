import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from '../entities/visit.entity';
import { Visitor } from '../entities/visitor.entity';
import { User } from '../entities/user.entity';
import { Event } from '../entities/event.entity';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, Visitor, User, Event]),
    NotificationsModule,
  ],
  providers: [VisitsService],
  controllers: [VisitsController],
  exports: [VisitsService],
})
export class VisitsModule {}
