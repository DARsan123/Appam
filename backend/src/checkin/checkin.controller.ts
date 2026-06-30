import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { CheckInService } from './checkin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, CheckInMode } from '../common/enums';

@Controller('checkin')
export class CheckInController {
  constructor(private checkInService: CheckInService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GATE_SECURITY, UserRole.SECURITY_SUPERVISOR, UserRole.ADMIN)
  validate(@Body() body: { qrToken: string; gateId: string; fastLane?: boolean }) {
    return this.checkInService.validateForCheckIn(body.qrToken, body.gateId, body.fastLane);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GATE_SECURITY, UserRole.SECURITY_SUPERVISOR, UserRole.ADMIN)
  checkIn(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      qrToken: string;
      gateId: string;
      mode?: CheckInMode;
      offlineClientId?: string;
    },
  ) {
    return this.checkInService.checkIn({
      ...body,
      securityOfficerId: req.user.id,
    });
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GATE_SECURITY, UserRole.SECURITY_SUPERVISOR, UserRole.ADMIN)
  checkOut(@Req() req: { user: { id: string } }, @Body() body: { qrToken: string }) {
    return this.checkInService.checkOut(body.qrToken, req.user.id);
  }

  @Post('walk-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GATE_SECURITY, UserRole.SECURITY_SUPERVISOR, UserRole.ADMIN)
  walkIn(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      visitorName: string;
      visitorPhone: string;
      purpose: string;
      hostId: string;
      campusId: string;
      gateId: string;
      photoUrl?: string;
      idDocumentUrl?: string;
    },
  ) {
    return this.checkInService.createWalkIn({
      ...body,
      securityOfficerId: req.user.id,
    });
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GATE_SECURITY, UserRole.SECURITY_SUPERVISOR, UserRole.ADMIN)
  syncOffline(
    @Body()
    body: {
      events: Array<{
        qrToken: string;
        gateId: string;
        securityOfficerId?: string;
        checkInTime: string;
        offlineClientId: string;
        type: 'check_in' | 'check_out';
      }>;
    },
  ) {
    return this.checkInService.syncOfflineEvents(body.events);
  }
}
