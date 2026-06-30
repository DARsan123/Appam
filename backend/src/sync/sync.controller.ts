import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Get('gate-cache')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GATE_SECURITY, UserRole.SECURITY_SUPERVISOR, UserRole.ADMIN)
  getGateCache(@Query('campusId') campusId?: string) {
    return this.syncService.getGateCache(campusId);
  }
}
