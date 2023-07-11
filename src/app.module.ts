import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './outlook.controller';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { OutlookService } from './outlook.service';
import { PrismaService } from './prisma.service';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, AuthController, GmailController, TaskController],
  providers: [
    AppService,
    GmailService,
    OutlookService,
    PrismaService,
    TaskService,
  ],
})
export class AppModule {}
