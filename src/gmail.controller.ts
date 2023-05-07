import { Controller, Get, Query } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get()
  async getInbox(@Query('userId') userId: string): Promise<void> {
    await this.gmailService.getInbox(userId);
  }
}
