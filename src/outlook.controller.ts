import { Controller, Get, Query } from '@nestjs/common';
import { OutlookService } from './outlook.service';

@Controller('outlook')
export class AuthController {
  constructor(private authService: OutlookService) {}
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
}
