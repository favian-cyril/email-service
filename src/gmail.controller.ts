import { Controller, Get, Query } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get()
  async getInbox(
    @Query('email') email: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.gmailService.getInbox(email, userId);
  }
}
