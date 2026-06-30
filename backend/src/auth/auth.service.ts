import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
      relations: ['campus'],
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.log({
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
      userId: user.id,
      ipAddress: ip,
    });

    const { passwordHash, ...profile } = user;
    return {
      accessToken: this.jwtService.sign({ sub: user.id, role: user.role }),
      user: profile,
    };
  }

  async findById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['campus'],
    });
    if (!user) return null;
    const { passwordHash, ...profile } = user;
    return profile;
  }
}
