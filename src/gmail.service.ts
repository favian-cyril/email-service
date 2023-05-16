import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { batchFetchImplementation } from '@jrmdayn/googleapis-batcher';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { Invoice } from '@prisma/client';
import {
  generateGmailQueryString,
  parseEmailsForInvoiceAmounts,
} from './utils/mail-parser';

const fetchImplementation = batchFetchImplementation();

type InvoiceInput = Omit<
  Invoice,
  'id' | 'senderEmailAddress' | 'senderEmailId' | 'userId'
> & { labels: { connect: { id: string }[] } } & {
  senderEmail: { connect: { id: string } };
} & {
  user: { connect: { id: string } };
};

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

    const { currency, senderEmails, additionalKeywords } =
      await this.prisma.user.findFirst({
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
    });

    await gmailClient.users.messages
      .list({
        userId: 'me',
        q: generateGmailQueryString(
          allSenderEmails.map((i) => i.email),
          new Date(),
          ['invoice', 'receipt', ...additionalKeywords],
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
          let sender;
          if (invoice) {
            sender = allSenderEmails.find(
              (email) => invoice.senderEmailAddress === email.email,
            );
            // delete because only sender id is needed
            delete invoice.senderEmailAddress;
            result.push({
              currency,
              senderEmail: {
                connect: {
                  id: sender.id,
                },
              },
              isValid: true,
              user: {
                connect: {
                  id: userId,
                },
              },
              labels: {
                connect: [
                  {
                    id: sender.labelId,
                  },
                ],
              },
              created: new Date(),
              ...invoice,
            });
          }
        });
      })
      .catch((err) => {
        console.error('The API returned an error:', err);
      });
    await Promise.all(
      result.map((invoice) => this.prisma.invoice.create({ data: invoice })),
    );
  }
}
