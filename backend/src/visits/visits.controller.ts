import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, VisitorCategory } from '../common/enums';

@Controller('visits')
export class VisitsController {
  constructor(private visitsService: VisitsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.EVENT_COORDINATOR)
  create(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      visitorName: string;
      visitorPhone: string;
      visitorEmail?: string;
      purpose: string;
      campusId: string;
      building?: string;
      expectedStart: string;
      expectedEnd: string;
      category?: VisitorCategory;
      vehicleNumber?: string;
      isVip?: boolean;
      securityNotes?: string;
    },
  ) {
    return this.visitsService.createVisit(req.user.id, body);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST)
  myVisits(@Req() req: { user: { id: string } }) {
    return this.visitsService.findForHost(req.user.id);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  pending(@Req() req: { user: { id: string; role: UserRole } }) {
    return this.visitsService.findPendingApprovals(req.user.id, req.user.role);
  }

  @Get('on-campus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.GATE_SECURITY,
    UserRole.SECURITY_SUPERVISOR,
    UserRole.ADMIN,
    UserRole.COMPLIANCE,
  )
  onCampus(@Query('campusId') campusId?: string, @Req() req?: { user: { campusId?: string } }) {
    return this.visitsService.getOnCampus(campusId ?? req?.user?.campusId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Get(':id/qr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.EVENT_COORDINATOR)
  getQr(@Param('id') id: string) {
    return this.visitsService.getQrCode(id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR)
  approve(@Param('id') id: string, @Req() req: { user: { id: string; role: UserRole } }) {
    return this.visitsService.approve(id, req.user.id, req.user.role);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR)
  reject(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
    @Body() body: { reason: string },
  ) {
    if (!body.reason) throw new BadRequestException('Rejection reason required');
    return this.visitsService.reject(id, req.user.id, body.reason);
  }
}
