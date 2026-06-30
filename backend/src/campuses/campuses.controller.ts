import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { CampusesService } from './campuses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('campuses')
export class CampusesController {
  constructor(private campusesService: CampusesService) {}

  @Get()
  findAll() {
    return this.campusesService.findAll();
  }

  @Get('gates')
  @UseGuards(JwtAuthGuard)
  findGates(@Query('campusId') campusId?: string) {
    return this.campusesService.findGates(campusId);
  }

  @Post('gates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createGate(@Body() body: { campusId: string; name: string; location: string; eventModeEnabled?: boolean }) {
    return this.campusesService.createGate(body.campusId, body);
  }
}
