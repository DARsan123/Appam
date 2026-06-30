import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PublicRegistrationService } from './public-registration.service';

@Controller('public')
export class PublicRegistrationController {
  constructor(private publicRegistrationService: PublicRegistrationService) {}

  @Get('visit/:token')
  getVisit(@Param('token') token: string) {
    return this.publicRegistrationService.getVisitByToken(token);
  }

  @Post('otp/send')
  sendOtp(@Body() body: { phone: string }) {
    return this.publicRegistrationService.sendOtp(body.phone);
  }

  @Post('register/:token')
  register(
    @Param('token') token: string,
    @Body()
    body: {
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
    return this.publicRegistrationService.completeRegistration(token, body);
  }
}
