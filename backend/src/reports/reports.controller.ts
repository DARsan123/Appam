import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR, UserRole.COMPLIANCE, UserRole.GATE_SECURITY)
  dashboard(@Query('campusId') campusId?: string) {
    return this.reportsService.dashboard(campusId);
  }

  @Get('daily-count')
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR, UserRole.COMPLIANCE)
  dailyCount(@Query('days') days?: string, @Query('campusId') campusId?: string) {
    return this.reportsService.dailyVisitorCount(days ? parseInt(days) : 7, campusId);
  }

  @Get('gate-traffic')
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR)
  gateTraffic(@Query('campusId') campusId?: string) {
    return this.reportsService.gateTraffic(campusId);
  }

  @Get('overdue-checkouts')
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR, UserRole.GATE_SECURITY)
  overdueCheckouts(@Query('maxHours') maxHours?: string) {
    return this.reportsService.overdueCheckouts(maxHours ? parseInt(maxHours) : 8);
  }

  @Get('headcount')
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR, UserRole.COMPLIANCE)
  headcount(@Query('campusId') campusId?: string) {
    return this.reportsService.headcountExport(campusId);
  }
}
