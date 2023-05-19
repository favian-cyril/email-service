import { Body, Controller, Post } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('add')
  async addTask(
    @Body()
    body: any,
  ): Promise<void> {
    console.log(body);
    const { userId, email, schedule, timezone } = body;
    await this.taskService.addTask(userId, email, schedule, timezone);
  }
}
