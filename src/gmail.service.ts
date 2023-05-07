import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { batchFetchImplementation } from '@jrmdayn/googleapis-batcher';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { Invoice, Label } from '@prisma/client';
import {
  generateGmailQueryString,
  parseEmailsForInvoiceAmounts,
} from './utils/mail-parser';

const fetchImplementation = batchFetchImplementation();

type InvoiceInput = Omit<Invoice, 'id'> & { labels: Label[] };

@Injectable()
export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor(private prisma: PrismaService, private redis: RedisService) {
    this.oauth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URL,
    );
  }

  async getInbox(userId: string): Promise<void> {
    const token = await this.redis.getAccessToken(userId);
    this.oauth2Client.setCredentials({
      access_token: token,
    });
    const gmailClient = google.gmail({
      version: 'v1',
      auth: this.oauth2Client,
      fetchImplementation,
    });

    const result: InvoiceInput[] = [];

    const { currency, senderEmails } = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        senderEmails: true,
      },
    });
    const senderEmailIds = senderEmails.map((i) => i.id);
    const allSenderEmails = await this.prisma.senderEmail.findMany({
      where: {
        id: {
          in: senderEmailIds,
        },
      },
      include: {
        labels: true,
      },
    });

    await gmailClient.users.messages
      .list({
        userId: 'me',
        q: generateGmailQueryString(
          allSenderEmails.map((i) => i.email),
          new Date('2023/05/06'),
          ['invoice', 'receipt'],
        ),
      })
      .then((response) => {
        // Construct an array of requests to retrieve the contents of each message
        console.log(response);
        const requests = response.data.messages.map((message) => {
          return gmailClient.users.messages.get({
            userId: 'me',
            id: message.id,
          });
        });
        return Promise.all(requests);
      })
      .then((responses) => {
        // Iterate through the responses and print the contents of each email
        responses.forEach(({ data }) => {
          const invoice = parseEmailsForInvoiceAmounts(data, currency);
          const sender = allSenderEmails.find(
            (email) => invoice.senderEmailAddress === email.email,
          );
          if (invoice)
            result.push({
              currency,
              senderEmailId: sender.id,
              isValid: true,
              userId,
              labels: sender.labels,
              created: new Date(),
              ...invoice,
            });
        });
      })
      .catch((err) => {
        console.error('The API returned an error:', err);
      });
    console.log(result);
    await this.prisma.invoice.createMany({
      data: result,
    });
  }
}
