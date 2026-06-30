import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE, UserRole.SECURITY_SUPERVISOR)
  findAll() {
    return this.auditService.findAll();
  }

  @Get('verify')
  @Roles(UserRole.ADMIN, UserRole.COMPLIANCE)
  verify() {
    return this.auditService.verifyChain();
  }
}
