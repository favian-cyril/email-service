import { Controller, Get, Headers } from '@nestjs/common';
import { GmailService, ResultObject } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get()
  async getInbox(
    @Headers('Authorization') token: string,
  ): Promise<ResultObject[]> {
    return await this.gmailService.getInbox(token);
  }
}
