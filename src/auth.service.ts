import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { decrypt, encrypt } from './utils/tokenEncrypt';
@Injectable()
export class AuthService {
  private oauth2Client: OAuth2Client;

  constructor(private prisma: PrismaService) {
    this.oauth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URL,
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

  async handleCallback(code: string, state: string) {
    // Exchange code for tokens
    const { tokens } = await this.oauth2Client.getToken(code);

    // Parse the state parameter to get the user ID
    const { userId } = JSON.parse(decodeURI(state));

    const encryptedToken = encrypt(tokens.refresh_token);

    // set credentials
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
    });

    // request user info
    const oauth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;
    // Save refresh token to the database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        userEmails: {
          connectOrCreate: {
            where: {
              email: email,
            },
            create: {
              email: email,
              refreshToken: encryptedToken,
            },
          },
        },
      },
    });
  }

  async getAccessToken(email: string): Promise<string> {
    const { refreshToken } = await this.prisma.userEmails.findFirst({
      where: { email: email },
    });
    return decrypt(refreshToken);
  }

  async generateTestUser() {
    const user = await this.prisma.user.create({
      data: {
        email: 'test@gmail.com',
        password: 'asdf',
        firstName: 'test',
        lastName: 'test',
        currency: 'Rp',
        categories: {
          create: [{ value: 'test label', color: '#ffffff' }],
        },
      },
      include: {
        categories: true,
      },
    });
    await this.prisma.senderEmail.create({
      data: {
        email: 'no-reply@grab.com',
        user: {
          connect: {
            id: user.id,
          },
        },
        category: {
          connect: {
            id: user.categories[0].id,
          },
        },
      },
    });
    return user;
  }
}
