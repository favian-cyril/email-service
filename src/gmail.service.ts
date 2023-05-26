import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { batchFetchImplementation } from '@jrmdayn/googleapis-batcher';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from './prisma.service';
import {
  generateGmailQueryString,
  parseEmailsForInvoiceAmounts,
} from './utils/mail-parser';
import { AuthService } from './auth.service';
import { InvoiceInput } from './types/mail.types';

const fetchImplementation = batchFetchImplementation();

@Injectable()
export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor(private prisma: PrismaService, private auth: AuthService) {
    this.oauth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URL,
    );
  }

  async getInbox(email: string, userId: string, date: string): Promise<void> {
    const token = await this.auth.getAccessToken(email);
    this.oauth2Client.setCredentials({
      refresh_token: token,
    });
    await this.oauth2Client.refreshAccessToken();
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
          new Date(date),
          ['invoice', 'receipt', ...additionalKeywords],
        ),
      })
      .then((response) => {
        // Construct an array of requests to retrieve the contents of each message
        if (!response.data.messages.length)
          return Promise.reject('no-new-mail');
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
              category: {
                connect: {
                  id: sender.categoryId || undefined,
                },
              },
              created: new Date(),
              ...invoice,
            });
          }
        });
      })
      .catch((err) => {
        if (err === 'no-new-mail') console.warn('No new mail detected');
        else console.error('The API returned an error:', err);
      });
    await Promise.all(
      result.map((invoice) => this.prisma.invoice.create({ data: invoice })),
    );
  }
}
