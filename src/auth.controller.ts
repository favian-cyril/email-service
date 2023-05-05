import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Get('url')
  async getAuthUrl(@Query('userId') userId: string): Promise<string> {
    return this.authService.generateAuthUrl(userId);
  }
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<void> {
    return this.authService.handleCallback(code, state);
  }
  @Get('register')
  async register(): Promise<string> {
    const user = await this.authService.generateTestUser();
    return user.id;
  }
}
