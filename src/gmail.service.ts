import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { batchFetchImplementation } from '@jrmdayn/googleapis-batcher';
import { OAuth2Client } from 'google-auth-library';

const fetchImplementation = batchFetchImplementation();

export interface ResultObject {
  content: string;
  title: string;
}

@Injectable()
export class GmailService {
  async getInbox(token: string): Promise<ResultObject[]> {
    const oAuth2Client = new OAuth2Client({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      redirectUri: 'http://localhost:3000/auth/callback',
    });
    oAuth2Client.setCredentials({
      access_token: token,
    });
    const gmailClient = google.gmail({
      version: 'v1',
      auth: oAuth2Client,
      fetchImplementation,
    });
    const result: ResultObject[] = [];
    await gmailClient.users.messages
      .list({ userId: 'me' })
      .then((response) => {
        // Construct an array of requests to retrieve the contents of each message
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
          // console.log(`Message ID: ${id}`);
          // console.log(`Snippet: ${responses[id].data.snippet}`);
          // console.log(`Body: ${responses[id].data.payload.body.data}`);
          result.push({ content: data.payload.body.data, title: data.snippet });
        });
      })
      .catch((err) => {
        console.error('The API returned an error:', err);
      });
    return result;
  }
}
