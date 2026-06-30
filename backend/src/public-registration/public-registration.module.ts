import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from '../entities/visit.entity';
import { Visitor } from '../entities/visitor.entity';
import { OtpVerification } from '../entities/otp-verification.entity';
import { PublicRegistrationService } from './public-registration.service';
import { PublicRegistrationController } from './public-registration.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, Visitor, OtpVerification])],
  providers: [PublicRegistrationService],
  controllers: [PublicRegistrationController],
})
export class PublicRegistrationModule {}
