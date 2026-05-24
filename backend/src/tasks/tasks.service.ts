import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(ticketId?: string) {
    const where: any = {};
    if (ticketId) {
      where.ticketId = ticketId;
    }
    return this.prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        ticket: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        ticket: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Задача не найдена');
    }
    return task;
  }

  async create(data: { title: string; description?: string; ticketId?: string; assigneeId?: string; deadline?: string }) {
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        ticketId: data.ticketId || null,
        assigneeId: data.assigneeId || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: 'TODO',
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        ticket: true,
      },
    });

    if (data.ticketId) {
      await this.prisma.auditLog.create({
        data: {
          action: 'TASK_CREATED_FOR_TICKET',
          details: `Создана задача "${task.title}" для заявки #${data.ticketId}.`,
        },
      });
    }

    return task;
  }

  async update(id: string, data: { title?: string; description?: string; status?: string; assigneeId?: string; deadline?: string }) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        ticket: true,
      },
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.task.delete({
      where: { id },
    });
    return { success: true };
  }
}
