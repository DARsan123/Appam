import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlacklistEntry } from '../entities/blacklist-entry.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../common/enums';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(BlacklistEntry) private blacklistRepo: Repository<BlacklistEntry>,
    private auditService: AuditService,
  ) {}

  findAll() {
    return this.blacklistRepo.find({
      where: { isActive: true },
      relations: ['scopeCampus', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    createdById: string,
    dto: {
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
    const entry = this.blacklistRepo.create({
      ...dto,
      createdById,
      isGlobal: dto.isGlobal ?? true,
      reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    const saved = await this.blacklistRepo.save(entry);

    await this.auditService.log({
      action: AuditAction.BLACKLIST,
      entityType: 'blacklist_entry',
      entityId: saved.id,
      userId: createdById,
      payload: { reason: dto.reason },
    });

    return saved;
  }

  async deactivate(id: string, userId: string) {
    await this.blacklistRepo.update(id, { isActive: false });
    await this.auditService.log({
      action: AuditAction.DELETE,
      entityType: 'blacklist_entry',
      entityId: id,
      userId,
    });
  }
}
