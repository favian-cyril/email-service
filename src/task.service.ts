import { Injectable, OnModuleInit } from '@nestjs/common';
import Bree from 'bree';
import path from 'path';
import tsplugin from '@breejs/ts-worker';
import { PrismaService } from './prisma.service';
import { convertCronToUTC } from './utils/timezoneCron';
Bree.extend(tsplugin);
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
      path: path.join(__dirname, 'utils', 'worker.ts'),
      worker: {
        workerData: {
          email: task.userEmailAddress,
          userId: task.userId,
        },
      },
    }));
    this.bree = new Bree({
      jobs,
    });
    this.bree.start();
  }
}
