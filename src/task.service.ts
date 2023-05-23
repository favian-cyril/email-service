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
      cron: convertCronToUTC(task.schedule, task.timezone),
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
    console.log(`${jobs.length} Tasks started`);
    await this.bree.start();
  }

  addTask(
    id: string,
    userId: string,
    email: string,
    schedule: string,
    timezone: string,
  ): void {
    this.bree.add({
      name: id,
      cron: convertCronToUTC(schedule, timezone),
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

  stopAndRemoveTask(id: string) {
    this.bree.stop(id);
    this.bree.remove(id);
  }

  updateTask(
    id: string,
    userId: string,
    email: string,
    schedule: string,
    timezone: string,
  ) {
    this.stopAndRemoveTask(id);
    this.addTask(id, userId, email, schedule, timezone);
  }
}
