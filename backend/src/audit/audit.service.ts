import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction } from '../common/enums';
import { hashChain } from '../common/utils';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    action: AuditAction;
    entityType: string;
    entityId?: string;
    payload?: Record<string, unknown>;
    userId?: string;
    ipAddress?: string;
    deviceInfo?: string;
  }): Promise<AuditLog> {
    const last = await this.auditRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    const payloadStr = JSON.stringify({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload,
      userId: params.userId,
      timestamp: new Date().toISOString(),
    });

    const hash = hashChain(last?.hash ?? null, payloadStr);

    const entry = this.auditRepo.create({
      ...params,
      hash,
      previousHash: last?.hash ?? null,
    });

    return this.auditRepo.save(entry);
  }

  async findAll(limit = 100) {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    const logs = await this.auditRepo.find({ order: { createdAt: 'ASC' } });
    let previousHash: string | null = null;

    for (const log of logs) {
      const payloadStr = JSON.stringify({
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        payload: log.payload,
        userId: log.userId,
        timestamp: log.createdAt.toISOString(),
      });
      const expected = hashChain(previousHash, payloadStr);
      if (log.hash !== expected || log.previousHash !== previousHash) {
        return { valid: false, brokenAt: log.id };
      }
      previousHash = log.hash;
    }
    return { valid: true };
  }
}
