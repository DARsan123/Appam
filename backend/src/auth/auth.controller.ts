import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }, @Req() req: { ip?: string }) {
    return this.authService.login(body.email, body.password, req.ip);
  }
}
