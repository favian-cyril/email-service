import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, AuthController, GmailController, TaskController],
  providers: [
    AppService,
    GmailService,
    AuthService,
    PrismaService,
    TaskService,
  ],
})
export class AppModule {}
