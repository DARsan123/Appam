import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, LessThan, MoreThan } from 'typeorm';
import { Visit } from '../entities/visit.entity';
import { Visitor } from '../entities/visitor.entity';
import { User } from '../entities/user.entity';
import { Event } from '../entities/event.entity';
import {
  VisitStatus,
  VisitorCategory,
  BadgeType,
  AuditAction,
  UserRole,
} from '../common/enums';
import { generateQrToken } from '../common/utils';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as QRCode from 'qrcode';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit) private visitRepo: Repository<Visit>,
    @InjectRepository(Visitor) private visitorRepo: Repository<Visitor>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async createVisit(
    hostId: string,
    dto: {
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
    let visitor = await this.visitorRepo.findOne({ where: { phone: dto.visitorPhone } });
    if (!visitor) {
      visitor = this.visitorRepo.create({
        name: dto.visitorName,
        phone: dto.visitorPhone,
        email: dto.visitorEmail,
      });
      visitor = await this.visitorRepo.save(visitor);
    }

    const category = dto.category ?? VisitorCategory.INDIVIDUAL;
    const requiredLevels = this.getRequiredApprovalLevels(category, dto.isVip);

    const visit = this.visitRepo.create({
      visitorId: visitor.id,
      hostId,
      campusId: dto.campusId,
      building: dto.building,
      purpose: dto.purpose,
      category,
      expectedStart: new Date(dto.expectedStart),
      expectedEnd: new Date(dto.expectedEnd),
      qrToken: generateQrToken(),
      vehicleNumber: dto.vehicleNumber,
      isVip: dto.isVip ?? false,
      securityNotes: dto.securityNotes,
      badgeType: this.getBadgeType(category, dto.isVip),
      status: requiredLevels === 0 ? VisitStatus.APPROVED : VisitStatus.PENDING_APPROVAL,
      requiredApprovalLevels: requiredLevels,
      approvalLevel: requiredLevels === 0 ? requiredLevels : 0,
      approvedAt: requiredLevels === 0 ? new Date() : undefined,
    });

    const saved = await this.visitRepo.save(visit);

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'visit',
      entityId: saved.id,
      userId: hostId,
      payload: { purpose: dto.purpose, category },
    });

    if (saved.status === VisitStatus.PENDING_APPROVAL) {
      await this.notificationsService.send({
        recipientId: hostId,
        channel: 'in_app',
        title: 'Visit Request Created',
        message: `Visit request for ${dto.visitorName} is pending approval.`,
        relatedEntityType: 'visit',
        relatedEntityId: saved.id,
      });
    }

    return this.findOne(saved.id);
  }

  private getRequiredApprovalLevels(category: VisitorCategory, isVip?: boolean): number {
    if (isVip || category === VisitorCategory.VIP) return 0;
    if (category === VisitorCategory.VENDOR || category === VisitorCategory.RECURRING) return 1;
    if (category === VisitorCategory.BULK_EVENT) return 0;
    return 1;
  }

  private getBadgeType(category: VisitorCategory, isVip?: boolean): BadgeType {
    if (isVip || category === VisitorCategory.VIP) return BadgeType.VIP;
    if (category === VisitorCategory.VENDOR) return BadgeType.VENDOR;
    if (category === VisitorCategory.BULK_EVENT) return BadgeType.EVENT;
    return BadgeType.STANDARD;
  }

  async findOne(id: string) {
    const visit = await this.visitRepo.findOne({
      where: { id },
      relations: ['visitor', 'host', 'campus', 'checkInRecords', 'checkInRecords.gate'],
    });
    if (!visit) throw new NotFoundException('Visit not found');
    return visit;
  }

  async findByQrToken(token: string) {
    const visit = await this.visitRepo.findOne({
      where: { qrToken: token },
      relations: ['visitor', 'host', 'campus'],
    });
    if (!visit) throw new NotFoundException('Invalid QR code');
    return visit;
  }

  async findForHost(hostId: string) {
    return this.visitRepo.find({
      where: { hostId },
      relations: ['visitor', 'campus'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingApprovals(userId: string, role: UserRole) {
    if (role === UserRole.HOST) {
      return this.visitRepo.find({
        where: { hostId: userId, status: VisitStatus.PENDING_APPROVAL },
        relations: ['visitor', 'campus', 'host'],
        order: { createdAt: 'ASC' },
      });
    }
    return this.visitRepo.find({
      where: { status: VisitStatus.PENDING_APPROVAL },
      relations: ['visitor', 'campus', 'host'],
      order: { createdAt: 'ASC' },
    });
  }

  async approve(visitId: string, approverId: string, role: UserRole) {
    const visit = await this.findOne(visitId);
    if (visit.status !== VisitStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Visit is not pending approval');
    }

    visit.approvalLevel += 1;
    if (visit.approvalLevel >= visit.requiredApprovalLevels) {
      visit.status = VisitStatus.APPROVED;
      visit.approvedById = approverId;
      visit.approvedAt = new Date();
    }

    await this.visitRepo.save(visit);

    await this.auditService.log({
      action: AuditAction.APPROVE,
      entityType: 'visit',
      entityId: visitId,
      userId: approverId,
    });

    await this.notificationsService.send({
      recipientId: visit.hostId,
      channel: 'sms',
      title: 'Visit Approved',
      message: `Visit for ${visit.visitor.name} has been approved.`,
      relatedEntityType: 'visit',
      relatedEntityId: visitId,
    });

    return this.findOne(visitId);
  }

  async reject(visitId: string, approverId: string, reason: string) {
    const visit = await this.findOne(visitId);
    visit.status = VisitStatus.REJECTED;
    visit.rejectionReason = reason;
    visit.approvedById = approverId;
    await this.visitRepo.save(visit);

    await this.auditService.log({
      action: AuditAction.REJECT,
      entityType: 'visit',
      entityId: visitId,
      userId: approverId,
      payload: { reason },
    });

    return this.findOne(visitId);
  }

  async getQrCode(visitId: string) {
    const visit = await this.findOne(visitId);
    const url = `${process.env.PUBLIC_REGISTER_URL ?? 'http://localhost:5175'}/v/${visit.qrToken}`;
    const dataUrl = await QRCode.toDataURL(url);
    return { qrToken: visit.qrToken, url, dataUrl };
  }

  async getOnCampus(campusId?: string) {
    const where: Record<string, unknown> = { status: VisitStatus.CHECKED_IN };
    if (campusId) where.campusId = campusId;

    return this.visitRepo.find({
      where,
      relations: ['visitor', 'host', 'campus', 'checkInRecords', 'checkInRecords.gate'],
      order: { updatedAt: 'DESC' },
    });
  }

  async bulkCreateFromCsv(
    coordinatorId: string,
    eventId: string,
    rows: Array<{ name: string; phone: string; email?: string; hostEmail?: string }>,
  ) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const results: Visit[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      const key = row.phone;
      if (seen.has(key)) continue;
      seen.add(key);

      let host = await this.userRepo.findOne({ where: { email: row.hostEmail ?? 'host@iiml.ac.in' } });
      if (!host) {
        host = await this.userRepo.findOne({ where: { role: UserRole.HOST } });
      }
      if (!host) throw new BadRequestException('No host found for bulk upload');

      const visit = await this.createVisit(host.id, {
        visitorName: row.name,
        visitorPhone: row.phone,
        visitorEmail: row.email,
        purpose: event.name,
        campusId: event.campusId,
        expectedStart: event.startDate.toISOString(),
        expectedEnd: event.endDate.toISOString(),
        category: VisitorCategory.BULK_EVENT,
      });

      visit.eventId = eventId;
      await this.visitRepo.update(visit.id, { eventId });
      results.push(await this.findOne(visit.id));
    }

    await this.auditService.log({
      action: AuditAction.BULK_UPLOAD,
      entityType: 'event',
      entityId: eventId,
      userId: coordinatorId,
      payload: { count: results.length },
    });

    return { created: results.length, visits: results };
  }
}
