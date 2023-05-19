import { Injectable, OnModuleInit } from '@nestjs/common';
import Bree from 'bree';
import path from 'path';
import { PrismaService } from './prisma.service';
import { convertCronToUTC } from './utils/timezoneCron';
@Injectable()
export class TaskService implements OnModuleInit {
  private bree: Bree;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const tasks = await this.prisma.task.findMany({
      where: { isActive: true },
    });
    const jobs: Bree.JobOptions[] = tasks.map((task) => ({
      name: task.id,
      cron: task.schedule,
      path: path.join(__dirname, 'jobs', 'worker.js'),
      worker: {
        workerData: {
          email: task.userEmailAddress,
          userId: task.userId,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          redirectUrl: process.env.REDIRECT_URL,
        },
      },
    }));
    this.bree = new Bree({
      root: false,
      jobs,
    });
    await this.bree.start();
  }

  async addTask(
    userId: string,
    email: string,
    schedule: string,
    timezone: string,
  ): Promise<void> {
    const { id } = await this.prisma.task.create({
      data: {
        schedule,
        timezone,
        isActive: true,
        user: {
          connect: {
            id: userId,
          },
        },
        userEmail: {
          connect: {
            email,
          },
        },
      },
    });
    this.bree.add({
      name: id,
      cron: schedule,
      path: path.join(__dirname, 'jobs', 'worker.js'),
      worker: {
        workerData: {
          email: email,
          userId,
          clientId: process.env.CLIENT_ID,
          clientSecret: process.env.CLIENT_SECRET,
          redirectUrl: process.env.REDIRECT_URL,
        },
      },
    });
  }
}
