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
    const { userId, email, schedule, timezone, id } = body;
    await this.taskService.addTask(id, userId, email, schedule, timezone);
  }

  @Post('remove')
  async removeTask(@Body() body: any): Promise<void> {
    const { id } = body;
    await this.taskService.stopAndRemoveTask(id);
  }

  @Post('update')
  async updateTask(@Body() body: any): Promise<void> {
    const { userId, email, schedule, timezone, id } = body;
    await this.taskService.updateTask(id, userId, email, schedule, timezone);
  }
}
