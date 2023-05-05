import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient();
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  setAccessToken(userId: string, accessToken: string): Promise<number> {
    return new Promise((resolve) => {
      const field = 'access_token';
      resolve(this.client.hSet(userId, field, accessToken));
    });
  }

  getAccessToken(userId: string): Promise<string | null> {
    return new Promise((resolve) => {
      const field = `access_token`;
      resolve(this.client.hGet(userId, field));
    });
  }
}
