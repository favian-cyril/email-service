import { Body, Controller, Post } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Post()
  async getInbox(
    @Body()
    body: any,
  ): Promise<void> {
    const { email, userId, date } = body;
    await this.gmailService.getInbox(email, userId, date);
  }
}
