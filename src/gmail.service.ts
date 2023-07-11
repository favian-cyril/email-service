import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { decrypt, encrypt } from './utils/tokenEncrypt';
@Injectable()
export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor(private prisma: PrismaService) {
    this.oauth2Client = new OAuth2Client(
      process.env.CLIENT_ID_GMAIL,
      process.env.CLIENT_SECRET_GMAIL,
      process.env.BASE_URL + '/gmail/callback',
    );
  }

  generateAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const state = JSON.stringify({ userId });

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state,
    });
  }

  async saveUserEmail(token: string, userId: string, email: string) {
    const encryptedToken = encrypt(token);
    // Save refresh token to the database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        userEmails: {
          upsert: {
            create: {
              email: email,
              refreshToken: encryptedToken,
            },
            update: {
              refreshToken: encryptedToken,
            },
            where: { email: email },
          },
        },
      },
    });
  }

  async handleCallback(code: string, state: string) {
    // Exchange code for tokens
    let tokens;
    try {
      tokens = await this.oauth2Client.getToken(code);
    } catch (e) {
      console.error(e);
    }

    // Parse the state parameter to get the user ID
    const { userId } = JSON.parse(decodeURI(state));

    // set credentials
    this.oauth2Client.setCredentials({
      access_token: tokens.tokens.access_token,
    });

    // request user info
    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    await this.saveUserEmail(tokens.tokens.refresh_token, userId, email);
  }

  async getAccessToken(email: string): Promise<string> {
    const { refreshToken } = await this.prisma.userEmails.findFirst({
      where: { email: email },
    });
    return decrypt(refreshToken);
  }
}
