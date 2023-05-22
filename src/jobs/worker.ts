import { parentPort, workerData } from 'worker_threads';
import { google } from 'googleapis';
import { batchFetchImplementation } from '@jrmdayn/googleapis-batcher';

const fetchImplementation = batchFetchImplementation();

import { PrismaClient } from '@prisma/client';
import { InvoiceInput } from 'src/types/mail.types';
import { OAuth2Client } from 'google-auth-library';
import {
  generateGmailQueryString,
  parseEmailsForInvoiceAmounts,
} from '../utils/mail-parser';
import { decrypt } from '../utils/tokenEncrypt';

const prisma = new PrismaClient();

async function getInbox() {
  const { userId, email, clientId, clientSecret, redirectUrl } = workerData;
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);
  const { refreshToken } = await prisma.userEmails.findFirst({
    where: { email: email },
  });
  const token = decrypt(refreshToken);
  oauth2Client.setCredentials({
    refresh_token: token,
  });
  await oauth2Client.refreshAccessToken();
  const gmailClient = google.gmail({
    version: 'v1',
    auth: oauth2Client,
    fetchImplementation,
  });

  const result: InvoiceInput[] = [];

  const { currency, senderEmails, additionalKeywords } =
    await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        senderEmails: true,
      },
    });
  const senderEmailIds = senderEmails.map((i) => i.id);
  const allSenderEmails = await prisma.senderEmail.findMany({
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
      if (!response.data.messages.length) return Promise.reject('no-new-mail');
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
                id: sender.categoryId,
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
    result.map((invoice) => prisma.invoice.create({ data: invoice })),
  );
}

getInbox().then(() => {
  parentPort.postMessage('Job completed!');
});
