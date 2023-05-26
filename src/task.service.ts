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
    console.log(jobs);
    this.bree.on('worker created', (name) => {
      console.log(`[${new Date()}]: Task ID ${name} started`);
    });
    this.bree.on('worker deleted', (name) => {
      console.log(`[${new Date()}]: Task ID ${name} stopped`);
    });
    console.log(`[${new Date()}]: ${jobs.length} Tasks started`);
    await this.bree.start();
  }

  async addTask(
    id: string,
    userId: string,
    email: string,
    schedule: string,
    timezone: string,
  ): Promise<void> {
    await this.bree.add({
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
    console.log(`[${new Date()}]: Task ID ${id} added`);
  }

  async stopAndRemoveTask(id: string): Promise<void> {
    await this.bree.stop(id);
    await this.bree.remove(id);
    console.log(`[${new Date()}]: Task ID ${id} removed`);
  }

  async updateTask(
    id: string,
    userId: string,
    email: string,
    schedule: string,
    timezone: string,
  ): Promise<void> {
    await this.stopAndRemoveTask(id);
    await this.addTask(id, userId, email, schedule, timezone);
    console.log(`[${new Date()}]: Task ID ${id} updated`);
  }
}
