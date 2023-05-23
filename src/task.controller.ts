import { Body, Controller, Post } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('add')
  addTask(
    @Body()
    body: any,
  ): void {
    const { userId, email, schedule, timezone, id } = body;
    this.taskService.addTask(id, userId, email, schedule, timezone);
  }

  @Post('remove')
  removeTask(@Body() body: any): void {
    const { id } = body;
    this.taskService.stopAndRemoveTask(id);
  }

  @Post('update')
  updateTask(@Body() body: any): void {
    const { userId, email, schedule, timezone, id } = body;
    this.taskService.updateTask(id, userId, email, schedule, timezone);
  }
}
