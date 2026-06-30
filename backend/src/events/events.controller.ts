import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  @Roles(UserRole.EVENT_COORDINATOR, UserRole.ADMIN, UserRole.HOST)
  findAll() {
    return this.eventsService.findAll();
  }

  @Post()
  @Roles(UserRole.EVENT_COORDINATOR, UserRole.ADMIN)
  create(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      name: string;
      campusId: string;
      startDate: string;
      endDate: string;
      expectedAttendees?: number;
      fastLaneEnabled?: boolean;
    },
  ) {
    return this.eventsService.create(req.user.id, body);
  }
}
