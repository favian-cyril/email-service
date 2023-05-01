import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, AuthController, GmailController],
  providers: [AppService, GmailService],
})
export class AppModule {}
