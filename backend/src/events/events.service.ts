import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private eventRepo: Repository<Event>) {}

  findAll() {
    return this.eventRepo.find({ relations: ['campus', 'coordinator'], order: { startDate: 'DESC' } });
  }

  async create(coordinatorId: string, dto: {
    name: string;
    campusId: string;
    startDate: string;
    endDate: string;
    expectedAttendees?: number;
    fastLaneEnabled?: boolean;
  }) {
    const event = this.eventRepo.create({
      ...dto,
      coordinatorId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
    return this.eventRepo.save(event);
  }
}
