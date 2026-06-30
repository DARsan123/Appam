import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Visit } from '../entities/visit.entity';
import { Visitor } from '../entities/visitor.entity';
import { OtpVerification } from '../entities/otp-verification.entity';
import { generateOtp } from '../common/utils';

@Injectable()
export class PublicRegistrationService {
  constructor(
    @InjectRepository(Visit) private visitRepo: Repository<Visit>,
    @InjectRepository(Visitor) private visitorRepo: Repository<Visitor>,
    @InjectRepository(OtpVerification) private otpRepo: Repository<OtpVerification>,
  ) {}

  async getVisitByToken(token: string) {
    const visit = await this.visitRepo.findOne({
      where: { qrToken: token },
      relations: ['visitor', 'host', 'campus'],
    });
    if (!visit) throw new NotFoundException('Invalid registration link');

    return {
      id: visit.id,
      visitorName: visit.visitor.name,
      visitorPhone: visit.visitor.phone,
      purpose: visit.purpose,
      campus: visit.campus?.name,
      host: visit.host?.name,
      expectedStart: visit.expectedStart,
      expectedEnd: visit.expectedEnd,
      status: visit.status,
      alreadyRegistered: !!visit.visitor.consentGiven,
    };
  }

  async sendOtp(phone: string) {
    const recent = await this.otpRepo.count({
      where: {
        phone,
        createdAt: MoreThan(new Date(Date.now() - 60 * 1000)),
      },
    });
    if (recent >= 3) throw new HttpException('Too many OTP requests. Please wait.', HttpStatus.TOO_MANY_REQUESTS);

    const otp = generateOtp();
    const entry = this.otpRepo.create({
      phone,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await this.otpRepo.save(entry);

    console.log(`[OTP] Phone ${phone}: ${otp}`);
    return { message: 'OTP sent', devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined };
  }

  async verifyOtp(phone: string, otp: string) {
    const entry = await this.otpRepo.findOne({
      where: { phone, verified: false },
      order: { createdAt: 'DESC' },
    });
    if (!entry || entry.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired or not found');
    }
    if (entry.otp !== otp) {
      entry.attemptCount += 1;
      await this.otpRepo.save(entry);
      throw new BadRequestException('Invalid OTP');
    }
    entry.verified = true;
    await this.otpRepo.save(entry);
    return { verified: true };
  }

  async completeRegistration(
    token: string,
    dto: {
      phone: string;
      otp: string;
      idProofType: string;
      idProofNumber: string;
      idDocumentUrl?: string;
      photoUrl?: string;
      consentGiven: boolean;
      vehicleNumber?: string;
    },
  ) {
    if (!dto.consentGiven) throw new BadRequestException('Consent is required per DPDP Act');

    await this.verifyOtp(dto.phone, dto.otp);

    const visit = await this.visitRepo.findOne({
      where: { qrToken: token },
      relations: ['visitor'],
    });
    if (!visit) throw new NotFoundException('Invalid registration link');

    if (visit.visitor.phone !== dto.phone) {
      throw new BadRequestException('Phone number does not match invitation');
    }

    await this.visitorRepo.update(visit.visitorId, {
      idProofType: dto.idProofType,
      idProofNumber: dto.idProofNumber,
      idDocumentUrl: dto.idDocumentUrl,
      photoUrl: dto.photoUrl,
      consentGiven: true,
      consentTimestamp: new Date(),
    });

    if (dto.vehicleNumber) {
      await this.visitRepo.update(visit.id, { vehicleNumber: dto.vehicleNumber });
    }

    return this.getVisitByToken(token);
  }
}
