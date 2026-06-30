import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { BlacklistService } from './blacklist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('blacklist')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlacklistController {
  constructor(private blacklistService: BlacklistService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR, UserRole.GATE_SECURITY)
  findAll() {
    return this.blacklistService.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR)
  create(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      phone?: string;
      idProofNumber?: string;
      visitorId?: string;
      reason: string;
      reasonCode: string;
      evidenceUrl?: string;
      isGlobal?: boolean;
      scopeCampusId?: string;
      reviewDate?: string;
      expiresAt?: string;
    },
  ) {
    return this.blacklistService.create(req.user.id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SECURITY_SUPERVISOR)
  deactivate(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.blacklistService.deactivate(id, req.user.id);
  }
}
