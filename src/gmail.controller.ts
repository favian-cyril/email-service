import { Controller, Get, Query } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { Invoice } from '@prisma/client';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get()
  async getInbox(
    @Query('userId') userId: string,
    @Query('currency') currency: string,
    @Query('senderEmails')
    senderEmails: string[] = ['noreply@tokopedia.com'],
  ): Promise<Invoice[]> {
    return await this.gmailService.getInbox(userId, currency, senderEmails);
  }
}
