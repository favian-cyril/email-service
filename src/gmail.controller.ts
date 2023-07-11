import { Controller, Get, Query } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private authService: GmailService) {}
  @Get('url-gmail')
  async getAuthUrl(@Query('userId') userId: string): Promise<string> {
    return this.authService.generateAuthUrl(userId);
  }
  @Get('callback-gmail')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<void> {
    return this.authService.handleCallback(code, state);
  }
}
