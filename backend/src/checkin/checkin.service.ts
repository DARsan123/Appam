import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, MoreThan } from 'typeorm';
import { Visit } from '../entities/visit.entity';
import { Visitor } from '../entities/visitor.entity';
import { CheckInRecord } from '../entities/check-in-record.entity';
import { Gate } from '../entities/gate.entity';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { VisitStatus, CheckInMode, AuditAction, VisitorCategory } from '../common/enums';
import { generateQrToken } from '../common/utils';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CheckInService {
  constructor(
    @InjectRepository(Visit) private visitRepo: Repository<Visit>,
    @InjectRepository(Visitor) private visitorRepo: Repository<Visitor>,
    @InjectRepository(CheckInRecord) private checkInRepo: Repository<CheckInRecord>,
    @InjectRepository(Gate) private gateRepo: Repository<Gate>,
    @InjectRepository(BlacklistEntry) private blacklistRepo: Repository<BlacklistEntry>,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async checkBlacklist(visitor: { phone?: string; idProofNumber?: string }, campusId?: string) {
    const now = new Date();
    const entries = await this.blacklistRepo.find({
      where: { isActive: true },
    });

    return entries.filter((entry) => {
      if (entry.expiresAt && entry.expiresAt < now) return false;
      if (!entry.isGlobal && entry.scopeCampusId && entry.scopeCampusId !== campusId) return false;

      const phoneMatch = entry.phone && visitor.phone && entry.phone === visitor.phone;
      const idMatch =
        entry.idProofNumber &&
        visitor.idProofNumber &&
        entry.idProofNumber === visitor.idProofNumber;

      return phoneMatch || idMatch;
    });
  }

  async validateForCheckIn(qrToken: string, gateId: string, fastLane = false) {
    const visit = await this.visitRepo.findOne({
      where: { qrToken },
      relations: ['visitor', 'host', 'campus'],
    });
    if (!visit) throw new NotFoundException('Invalid QR code');

    const gate = await this.gateRepo.findOne({ where: { id: gateId }, relations: ['campus'] });
    if (!gate) throw new NotFoundException('Gate not found');

    const now = new Date();
    if (visit.expectedEnd < now && visit.status !== VisitStatus.CHECKED_IN) {
      throw new BadRequestException('Visit window has expired');
    }

    const blacklistHits = await this.checkBlacklist(
      { phone: visit.visitor.phone, idProofNumber: visit.visitor.idProofNumber },
      gate.campusId,
    );

    if (blacklistHits.length > 0) {
      await this.notificationsService.send({
        recipientId: visit.hostId,
        channel: 'in_app',
        title: 'BLACKLIST ALERT',
        message: `Blacklisted visitor ${visit.visitor.name} attempted check-in at ${gate.name}`,
        relatedEntityType: 'visit',
        relatedEntityId: visit.id,
      });
      throw new ForbiddenException({
        message: 'Visitor is on blacklist',
        silentAlert: true,
        reason: blacklistHits[0].reason,
      });
    }

    if (!fastLane && visit.status !== VisitStatus.APPROVED && visit.status !== VisitStatus.CHECKED_IN) {
      throw new BadRequestException('Visit not approved');
    }

    if (fastLane && visit.category !== VisitorCategory.BULK_EVENT && visit.status !== VisitStatus.APPROVED) {
      throw new BadRequestException('Fast lane requires pre-approved event visit');
    }

    return { visit, gate, approved: visit.status === VisitStatus.APPROVED || visit.status === VisitStatus.CHECKED_IN };
  }

  async checkIn(params: {
    qrToken: string;
    gateId: string;
    securityOfficerId?: string;
    mode?: CheckInMode;
    offlineClientId?: string;
  }) {
    const fastLane = params.mode === CheckInMode.FAST_LANE;
    const { visit, gate } = await this.validateForCheckIn(params.qrToken, params.gateId, fastLane);

    if (visit.status === VisitStatus.CHECKED_IN) {
      throw new BadRequestException('Visitor already checked in');
    }

    const badgeNumber = `VMS-${Date.now().toString(36).toUpperCase()}`;

    const record = this.checkInRepo.create({
      visitId: visit.id,
      gateId: params.gateId,
      securityOfficerId: params.securityOfficerId,
      checkInTime: new Date(),
      mode: params.mode ?? CheckInMode.STANDARD,
      badgeNumber,
      syncedFromOffline: params.mode === CheckInMode.OFFLINE,
      offlineClientId: params.offlineClientId,
    });

    await this.checkInRepo.save(record);

    visit.status = VisitStatus.CHECKED_IN;
    visit.qrUsed = true;
    await this.visitRepo.save(visit);

    await this.auditService.log({
      action: AuditAction.CHECK_IN,
      entityType: 'visit',
      entityId: visit.id,
      userId: params.securityOfficerId,
      payload: { gateId: params.gateId, badgeNumber, mode: params.mode },
    });

    await this.notificationsService.send({
      recipientId: visit.hostId,
      channel: 'sms',
      title: 'Visitor Arrived',
      message: `${visit.visitor.name} has checked in at ${gate.name}.`,
      relatedEntityType: 'visit',
      relatedEntityId: visit.id,
    });

    return {
      visit: await this.visitRepo.findOne({
        where: { id: visit.id },
        relations: ['visitor', 'host', 'campus', 'checkInRecords'],
      }),
      badge: {
        number: badgeNumber,
        visitorName: visit.visitor.name,
        hostName: visit.host?.name,
        validUntil: visit.expectedEnd,
        badgeType: visit.badgeType,
        photoUrl: visit.visitor.photoUrl,
      },
    };
  }

  async checkOut(qrToken: string, securityOfficerId?: string) {
    const visit = await this.visitRepo.findOne({
      where: { qrToken },
      relations: ['visitor', 'checkInRecords'],
    });
    if (!visit) throw new NotFoundException('Invalid QR code');
    if (visit.status !== VisitStatus.CHECKED_IN) {
      throw new BadRequestException('Visitor is not checked in');
    }

    const activeRecord = visit.checkInRecords.find((r) => !r.checkOutTime);
    if (activeRecord) {
      activeRecord.checkOutTime = new Date();
      await this.checkInRepo.save(activeRecord);
    }

    visit.status = VisitStatus.CHECKED_OUT;
    await this.visitRepo.save(visit);

    await this.auditService.log({
      action: AuditAction.CHECK_OUT,
      entityType: 'visit',
      entityId: visit.id,
      userId: securityOfficerId,
    });

    await this.notificationsService.send({
      recipientId: visit.hostId,
      channel: 'sms',
      title: 'Visitor Departed',
      message: `${visit.visitor.name} has checked out.`,
      relatedEntityType: 'visit',
      relatedEntityId: visit.id,
    });

    return visit;
  }

  async createWalkIn(dto: {
    visitorName: string;
    visitorPhone: string;
    purpose: string;
    hostId: string;
    campusId: string;
    gateId: string;
    securityOfficerId?: string;
    photoUrl?: string;
    idDocumentUrl?: string;
  }) {
    let visitor = await this.visitorRepo.findOne({ where: { phone: dto.visitorPhone } });
    if (!visitor) {
      visitor = this.visitorRepo.create({
        name: dto.visitorName,
        phone: dto.visitorPhone,
        photoUrl: dto.photoUrl,
        idDocumentUrl: dto.idDocumentUrl,
      });
      visitor = await this.visitorRepo.save(visitor);
    }

    const visit = this.visitRepo.create({
      visitorId: visitor.id,
      hostId: dto.hostId,
      campusId: dto.campusId,
      purpose: dto.purpose,
      category: VisitorCategory.WALK_IN,
      status: VisitStatus.PENDING_APPROVAL,
      expectedStart: new Date(),
      expectedEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
      qrToken: generateQrToken(),
      requiredApprovalLevels: 1,
      approvalLevel: 0,
    });

    const saved = await this.visitRepo.save(visit);

    await this.notificationsService.send({
      recipientId: dto.hostId,
      channel: 'sms',
      title: 'Walk-in Approval Required',
      message: `${dto.visitorName} is at the gate. Please approve or reject.`,
      relatedEntityType: 'visit',
      relatedEntityId: saved.id,
    });

    return saved;
  }

  async syncOfflineEvents(events: Array<{
    qrToken: string;
    gateId: string;
    securityOfficerId?: string;
    checkInTime: string;
    offlineClientId: string;
    type: 'check_in' | 'check_out';
  }>) {
    const results = [];
    for (const event of events) {
      try {
        if (event.type === 'check_in') {
          const result = await this.checkIn({
            qrToken: event.qrToken,
            gateId: event.gateId,
            securityOfficerId: event.securityOfficerId,
            mode: CheckInMode.OFFLINE,
            offlineClientId: event.offlineClientId,
          });
          results.push({ success: true, event, result });
        } else {
          const result = await this.checkOut(event.qrToken, event.securityOfficerId);
          results.push({ success: true, event, result });
        }
      } catch (err) {
        results.push({ success: false, event, error: (err as Error).message });
      }
    }

    await this.auditService.log({
      action: AuditAction.SYNC,
      entityType: 'offline_queue',
      payload: { count: events.length, results: results.length },
    });

    return results;
  }
}
