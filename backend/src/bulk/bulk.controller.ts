import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { VisitsService } from '../visits/visits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('bulk')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BulkController {
  constructor(private visitsService: VisitsService) {}

  @Post('upload')
  @Roles(UserRole.EVENT_COORDINATOR, UserRole.ADMIN)
  upload(
    @Req() req: { user: { id: string } },
    @Body() body: { eventId: string; csv: string },
  ) {
    if (!body.csv || !body.eventId) {
      throw new BadRequestException('eventId and csv content required');
    }

    let rows: Array<{ name: string; phone: string; email?: string; hostEmail?: string }>;
    try {
      rows = parse(body.csv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch {
      throw new BadRequestException('Invalid CSV format');
    }

    return this.visitsService.bulkCreateFromCsv(req.user.id, body.eventId, rows);
  }
}
