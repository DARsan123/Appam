import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notifRepo: Repository<Notification>,
  ) {}

  async send(params: {
    recipientId: string;
    channel: string;
    title: string;
    message: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    const notification = this.notifRepo.create(params);
    await this.notifRepo.save(notification);
    // Simulated SMS/email delivery logged to console in dev
    console.log(`[NOTIFICATION][${params.channel}] To ${params.recipientId}: ${params.title} - ${params.message}`);
    return notification;
  }

  async findForUser(userId: string) {
    return this.notifRepo.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(id: string) {
    await this.notifRepo.update(id, { read: true });
  }
}
