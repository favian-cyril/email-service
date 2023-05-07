import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { OAuth2Client } from 'google-auth-library';
@Injectable()
export class AuthService {
  private oauth2Client: OAuth2Client;

  constructor(private prisma: PrismaService, private redis: RedisService) {
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

    // Save refresh token to the database
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: tokens.refresh_token },
    });

    // Save access token to Redis
    await this.redis.setAccessToken(userId, tokens.access_token);
  }

  async generateTestUser() {
    const user = await this.prisma.user.create({
      data: {
        email: 'test@gmail.com',
        firstName: 'test',
        lastName: 'test',
        currency: 'Rp',
        labels: {
          create: [{ value: 'test label', color: '#ffffff' }],
        },
        senderEmails: {
          create: [
            {
              email: 'no-reply@grab.com',
            },
          ],
        },
      },
      include: {
        senderEmails: true,
        labels: true,
      },
    });
    await this.prisma.senderEmail.update({
      where: { id: user.senderEmails[0].id },
      data: {
        labels: {
          set: user.labels,
        },
      },
    });
    return user;
  }
}
