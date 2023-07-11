import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { decrypt, encrypt } from './utils/tokenEncrypt';
import { ConfidentialClientApplication } from '@azure/msal-node';
@Injectable()
export class OutlookService {
  private client: ConfidentialClientApplication;
  private scopes: string[];
  constructor(private prisma: PrismaService) {
    this.client = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.CLIENT_ID_OUTLOOK,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID_OUTLOOK}`,
        clientSecret: process.env.CLIENT_SECRET_OUTLOOK,
      },
    });
    this.scopes = [
      'offline_access',
      'Mail.Read',
      'Mail.ReadBasic',
      'Mail.ReadWrite',
      'Mail.Send',
      'User.Read',
    ];
  }

  async generateAuthUrl(userId: string): Promise<string> {
    // const authUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID_OUTLOOK}/oauth2/v2.0/authorize`;
    // // TODO: Change to normal permission, only used for invoice email

    const state = JSON.stringify({ userId });
    // const params = new URLSearchParams({
    //   client_id: process.env.CLIENT_ID_OUTLOOK,
    //   response_type: 'code',
    //   redirect_uri: process.env.BASE_URL + '/outlook/callback',
    //   scope,
    //   state,
    // }).toString();
    // return authUrl + params;
    const response = await this.client.getAuthCodeUrl({
      scopes: this.scopes,
      redirectUri: process.env.BASE_URL + '/outlook/callback',
      state,
    });
    return response;
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
    // console.log(code);
    // const creds = new AuthorizationCodeCredential(
    //   process.env.TENANT_ID_OUTLOOK,
    //   process.env.CLIENT_ID_OUTLOOK,
    //   process.env.CLIENT_SECRET_OUTLOOK,
    //   code,
    //   process.env.BASE_URL + '/auth/callback-outlook',
    // );
    // const scope = [
    //   'Mail.Read',
    //   'Mail.ReadBasic',
    //   'Mail.ReadBasic.All',
    //   'Mail.ReadWrite',
    //   'Mail.Send',
    //   'User.Read',
    // ].reduce((acc, cur) => 'https://graph.microsoft.com' + cur + ' ' + acc, '');
    // const token = await creds.getToken(scope);
    // console.log(token, state);
    const response = await this.client.acquireTokenByCode({
      code,
      scopes: this.scopes,
      redirectUri: process.env.BASE_URL + '/outlook/callback',
    });
    console.log(response, state);
  }

  async getAccessToken(email: string): Promise<string> {
    const { refreshToken } = await this.prisma.userEmails.findFirst({
      where: { email: email },
    });
    return decrypt(refreshToken);
  }
}
