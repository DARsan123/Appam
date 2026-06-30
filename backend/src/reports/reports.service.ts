import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { Visit } from '../entities/visit.entity';
import { CheckInRecord } from '../entities/check-in-record.entity';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { VisitStatus } from '../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Visit) private visitRepo: Repository<Visit>,
    @InjectRepository(CheckInRecord) private checkInRepo: Repository<CheckInRecord>,
    @InjectRepository(BlacklistEntry) private blacklistRepo: Repository<BlacklistEntry>,
  ) {}

  async dashboard(campusId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visitWhere: Record<string, unknown> = {};
    if (campusId) visitWhere.campusId = campusId;

    const [onCampus, todayVisits, pendingApprovals, blacklistCount] = await Promise.all([
      this.visitRepo.count({ where: { ...visitWhere, status: VisitStatus.CHECKED_IN } }),
      this.visitRepo.count({
        where: { ...visitWhere, createdAt: Between(today, tomorrow) },
      }),
      this.visitRepo.count({ where: { ...visitWhere, status: VisitStatus.PENDING_APPROVAL } }),
      this.blacklistRepo.count({ where: { isActive: true } }),
    ]);

    return { onCampus, todayVisits, pendingApprovals, blacklistCount };
  }

  async dailyVisitorCount(days = 7, campusId?: string) {
    const results = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);

      const where: Record<string, unknown> = { createdAt: Between(date, next) };
      if (campusId) where.campusId = campusId;

      const count = await this.visitRepo.count({ where });
      results.push({ date: date.toISOString().split('T')[0], count });
    }
    return results;
  }

  async gateTraffic(campusId?: string) {
    const records = await this.checkInRepo.find({
      relations: ['gate', 'gate.campus'],
      order: { checkInTime: 'DESC' },
      take: 500,
    });

    const filtered = campusId
      ? records.filter((r) => r.gate?.campusId === campusId)
      : records;

    const byGate: Record<string, number> = {};
    for (const r of filtered) {
      const name = r.gate?.name ?? 'Unknown';
      byGate[name] = (byGate[name] ?? 0) + 1;
    }
    return Object.entries(byGate).map(([gate, count]) => ({ gate, count }));
  }

  async overdueCheckouts(maxHours = 8) {
    const cutoff = new Date(Date.now() - maxHours * 60 * 60 * 1000);
    const visits = await this.visitRepo.find({
      where: { status: VisitStatus.CHECKED_IN },
      relations: ['visitor', 'host', 'campus', 'checkInRecords'],
    });

    return visits.filter((v) => {
      const record = v.checkInRecords.find((r) => !r.checkOutTime);
      return record && record.checkInTime < cutoff;
    });
  }

  async headcountExport(campusId?: string) {
    const where: Record<string, unknown> = { status: VisitStatus.CHECKED_IN };
    if (campusId) where.campusId = campusId;

    const visits = await this.visitRepo.find({
      where,
      relations: ['visitor', 'host', 'campus', 'checkInRecords', 'checkInRecords.gate'],
    });

    return visits.map((v) => ({
      visitorName: v.visitor.name,
      visitorPhone: v.visitor.phone,
      host: v.host?.name,
      campus: v.campus?.name,
      gate: v.checkInRecords.find((r) => !r.checkOutTime)?.gate?.name,
      checkInTime: v.checkInRecords.find((r) => !r.checkOutTime)?.checkInTime,
      building: v.building,
    }));
  }
}
