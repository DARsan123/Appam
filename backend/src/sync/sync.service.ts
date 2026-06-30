import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { Visit } from '../entities/visit.entity';
import { CheckInRecord } from '../entities/check-in-record.entity';
import { VisitStatus } from '../common/enums';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(BlacklistEntry) private blacklistRepo: Repository<BlacklistEntry>,
    @InjectRepository(Visit) private visitRepo: Repository<Visit>,
  ) {}

  async getGateCache(campusId?: string) {
    const hosts = await this.userRepo.find({
      where: { isActive: true },
      relations: ['campus'],
    });

    const blacklist = await this.blacklistRepo.find({ where: { isActive: true } });

    const approvedVisits = await this.visitRepo.find({
      where: [
        { status: VisitStatus.APPROVED },
        { status: VisitStatus.CHECKED_IN },
      ],
      relations: ['visitor', 'host'],
    });

    return {
      syncedAt: new Date().toISOString(),
      hosts: hosts.map((h) => ({
        id: h.id,
        name: h.name,
        email: h.email,
        department: h.department,
        campusId: h.campusId,
      })),
      blacklist: blacklist.map((b) => ({
        id: b.id,
        phone: b.phone,
        idProofNumber: b.idProofNumber,
        reason: b.reason,
        isGlobal: b.isGlobal,
        scopeCampusId: b.scopeCampusId,
        expiresAt: b.expiresAt,
      })),
      approvedVisits: approvedVisits.map((v) => ({
        id: v.id,
        qrToken: v.qrToken,
        visitorName: v.visitor?.name,
        visitorPhone: v.visitor?.phone,
        status: v.status,
        category: v.category,
        expectedEnd: v.expectedEnd,
      })),
    };
  }
}
